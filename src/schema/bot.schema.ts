import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({
    timestamps:true,
    collection:'students'
})

export class Bot{
    @Prop({
        required:true
    })
    chatId:number
    @Prop({
        required:true
    })
    name:string
}
export const BotSchema = SchemaFactory.createForClass(Bot)