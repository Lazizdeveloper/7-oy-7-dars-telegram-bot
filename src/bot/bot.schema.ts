import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
  collection: 'students',
})
export class Bot {
  @Prop({ required: true })
  chatId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ score: Number, date: Date }], default: [] })
  quizResults: { score: number; date: Date }[];
}

export const BotSchema = SchemaFactory.createForClass(Bot);