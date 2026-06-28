import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type blockDocument = HydratedDocument<GetBlock>;

@Schema({ collection: 'data' })
export class GetBlock {
  @Prop({ required: true, unique: true })
  email: string;
  @Prop({required: true, type: Array, default: []})
  blocks: Array<{
    id: string;
    method: string;
    mood: string;
    direction: string;
    developers: string[];
    deadline: object[]
  }>;
  @Prop({required: true})
  projects: Object[];
  data: object[]
  @Prop({require: true})
  project_name: string
}
@Schema({collection: 'projects'})
export class GetProjects{
  @Prop({required: true, unique: true})
  email: string;
  projects: Array<{
    title: string,
    direction: string
  }>;
}

export const blockSchema = SchemaFactory.createForClass(GetBlock);
export const blockSchemaGetter = SchemaFactory.createForClass(GetProjects)