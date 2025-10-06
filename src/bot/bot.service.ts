import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import TelegramBot from 'node-telegram-bot-api';
import { Bot } from 'src/schema/bot.schema';

interface QuizState {
  currentQuestion: number;
  correctAnswers: number;
  questions: { question: string; answer: number }[];
}

@Injectable()
export class BotService {
  private bot: TelegramBot;
  private teacherId = Number(process.env.TEACHER_ID);
  private quizStates: { [chatId: number]: QuizState } = {}; 

  constructor(@InjectModel(Bot.name) private BotModel: Model<Bot>) {
    this.bot = new TelegramBot(process.env.BOT_TOKEN as string, { polling: true });

    
    this.bot.setMyCommands([
      { description: "Ro'yxatdan o'tish", command: '/start' },
      { description: 'Matematik testni boshlash', command: '/quiz' },
    ]);

  
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.from!.id;
      if (chatId === this.teacherId) {
        return this.bot.sendMessage(this.teacherId, 'Siz teachersiz');
      }
      const findStudent = await this.BotModel.findOne({ chatId });
      if (!findStudent) {
        await this.BotModel.create({ chatId, name: msg.from?.first_name });
        this.bot.sendMessage(chatId, `Muvafaqiyatli ro'yxatdan o'tdingiz!`);
        this.bot.sendMessage(
          this.teacherId,
          `O'quvchi ${msg.from?.first_name} qo'shildi`,
        );
      } else {
        this.bot.sendMessage(chatId, "Allaqaqon ro'yxatdan o'tgansiz");
      }
    });


    this.bot.onText(/\/quiz/, (msg) => {
      const chatId = msg.from!.id;
      if (chatId === this.teacherId) {
        return this.bot.sendMessage(chatId, "Teacherlar test ishlolmaydi!");
      }
      this.startQuiz(chatId);
    });

  
    this.bot.on('message', (msg) => {
      const chatId = msg.from!.id;
      const text = msg.text;


      if (text && text !== '/start' && text !== '/quiz') {
        this.bot.sendMessage(
          this.teacherId,
          `${chatId}: ${msg.from?.first_name} dan xabar, ${text}`,
        );
      }

  
      if (this.quizStates[chatId] && text && !text.startsWith('/')) {
        this.handleAnswer(chatId, text);
      }
    });
  }

 
  private generateQuestion(): { question: string; answer: number } {
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1 = Math.floor(Math.random() * 50) + 1;
    let num2 = Math.floor(Math.random() * 50) + 1;
    let answer: number;

    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      case '/':

        num2 = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * (Math.floor(Math.random() * 10) + 1); 
        answer = num1 / num2;
        break;
      default:
        answer = 0;
    }

    return { question: `${num1} ${operator} ${num2} =`, answer };
  }

  
  private startQuiz(chatId: number) {
   
    const questions = Array.from({ length: 10 }, () => this.generateQuestion());
    this.quizStates[chatId] = {
      currentQuestion: 0,
      correctAnswers: 0,
      questions,
    };

    this.bot.sendMessage(
      chatId,
      `Matematik test boshlandi! 10 ta savol bo'ladi. Birinchi savol:\n${questions[0].question}`,
    );
  }

 
  private handleAnswer(chatId: number, answer: string) {
    const state = this.quizStates[chatId];
    if (!state) return;

    const currentQuestion = state.questions[state.currentQuestion];
    const correctAnswer = currentQuestion.answer;
    const userAnswer = parseFloat(answer);

   
    if (!isNaN(userAnswer) && userAnswer === correctAnswer) {
      state.correctAnswers++;
      this.bot.sendMessage(chatId, 'Toʻgʻri! ✅');
    } else {
      this.bot.sendMessage(
        chatId,
        `Notoʻgʻri! ❌ Toʻgʻri javob: ${correctAnswer}`,
      );
    }

    state.currentQuestion++;
    if (state.currentQuestion < 10) {
      this.bot.sendMessage(
        chatId,
        `Keyingi savol (${state.currentQuestion + 1}/10):\n${state.questions[state.currentQuestion].question}`,
      );
    } else {
  
      this.bot.sendMessage(
        chatId,
        `Test tugadi! Siz ${state.correctAnswers}/10 ta savolga to'g'ri javob berdingiz.\nYana test ishlash uchun /quiz buyrug'ini yuboring.`,
      );
      delete this.quizStates[chatId]; 
    }
  }
}