import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AnalysisResult extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
  repositoryId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  severity: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  suggestion: string;

  @Prop({ type: Object, required: true })
  location: {
    file: string;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
  };

  @Prop({ min: 0, max: 1, required: true })
  confidence: number;

  @Prop({ required: true })
  impact: string;

  @Prop({ required: true })
  effort: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [Types.ObjectId], ref: 'AnalysisResult' })
  relatedResults?: Types.ObjectId[];
}

export const AnalysisResultSchema = SchemaFactory.createForClass(AnalysisResult);

// Create indexes for better query performance
AnalysisResultSchema.index({ repositoryId: 1 });
AnalysisResultSchema.index({ category: 1, severity: 1 });
AnalysisResultSchema.index({ createdAt: -1 });
