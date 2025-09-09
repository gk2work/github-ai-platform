import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Repository extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  primaryLanguage: string;

  @Prop({ type: Array, default: [] })
  languages: Array<{
    language: string;
    percentage: number;
    bytes: number;
  }>;

  @Prop({ default: 0 })
  size: number;

  @Prop()
  starCount?: number;

  @Prop()
  forkCount?: number;

  @Prop()
  lastCommitAt?: Date;

  @Prop()
  analyzedAt?: Date;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ default: 'main' })
  defaultBranch: string;

  @Prop({ type: Object })
  metrics?: {
    totalFiles: number;
    totalLines: number;
    totalComplexity: number;
    averageComplexity: number;
    technicalDebtRatio: number;
    testCoverage?: number;
    securityScore: number;
    maintainabilityIndex: number;
    duplicationPercentage: number;
  };
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);

// Create compound index for unique owner/name combination
RepositorySchema.index({ owner: 1, name: 1 }, { unique: true });
RepositorySchema.index({ analyzedAt: 1 });
