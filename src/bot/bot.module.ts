import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { Mongoose } from 'mongoose';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { Bot, BotSchema } from 'src/schema/bot.schema';

@Module({
    imports:[MongooseModule.forFeature([
        {name:Bot.name, schema:BotSchema}
    ])],
    providers: [BotService]
})
export class BotModule {}
