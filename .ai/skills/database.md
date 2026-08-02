# Database Skill

## Identity
- **Name**: Database Design & Operations
- **Domain**: Data modeling, query optimization, and database management
- **Technologies**: MongoDB, Redis

## Capabilities

### MongoDB (Mongoose)
- **Document Schemas**: Design schema definitions with strict validation, custom validators, and standard type casting.
- **Transactions & Sessions**: Implement multi-document transactions using Mongoose sessions to ensure ACID compliance across operations.
- **Query Optimization**: Use `.lean()` for read-only queries to bypass model hydration and improve latency.
- **Aggregations**: Build robust aggregation pipelines for complex reporting, data transformations, and high-performance lookups.
- **Indexing**: Define compound, text, partial, and TTL indexes directly in schemas to support efficient query paths.
- **Middleware**: Use pre/post hooks (e.g., hash passwords before save, cascading logical deletes).
- **Soft Deletes**: Standardize soft delete patterns via query middleware.

### Redis
- **Caching Layer**: Configure namespace-based keys (`app:module:entity:id`) for caching hot data paths.
- **Session Management**: Implement secure user session storage with TTL-based expiration.
- **Rate Limiting**: Build highly scalable sliding-window rate limiters.
- **Pub/Sub**: Use Redis Pub/Sub for real-time notifications and cross-instance communication.
- **Redis Streams**: Leverage event-sourcing patterns and high-throughput real-time message routing.
- **Connection Rule**: Always connect to Redis using the single `REDIS_URL` environment variable. Do not split connection details into separate host, port, and password variables.

## Schema Design Rules

### MongoDB Schemas (Mongoose)

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// Schema Middleware Example
UserSchema.pre<UserDocument>('save', async function (next) {
  if (this.isModified('password')) {
    // Hash password logic here
  }
  next();
});
```

### Indexing Strategy

```
Rules:
  1. Index every field frequently used in query filters (Mongoose custom schema indexes).
  2. Create compound indexes following the ESR rule: Equality first, Sort second, Range third.
  3. Use partial indexes to index subset documents (e.g., only index documents where { deletedAt: null }).
  4. Implement TTL indexes for automated cleanup of logs, sessions, or temporary tokens.
  5. Always verify query optimization using `.explain('executionStats')` on slow queries.
  6. Disable autoIndex in production options to prevent background lock-ups; define indexes explicitly.
```

### Migration Rules

```
Rules:
  1. Schema changes in MongoDB should favor backwards compatibility (optional fields, defaults).
  2. For breaking structural changes, use a schema versioning pattern (e.g., add a schemaVersion field).
  3. Perform bulk migration operations using isolated migration scripts (e.g., using migrate-mongo).
  4. Test migration scripts on staging databases cloned from production data before execution.
  5. Ensure migrations are backward-compatible so that the application remains functional during blue-green deployment.
  6. Keep data backfills separate from application code deployment.
```

## Anti-Patterns (Never Do)

- **Never enable auto-indexing in production** — it locks databases during deployment. Set `autoIndex: false` in production Mongoose configurations.
- **Never run unindexed queries** in production — verify query paths with explain stats.
- **Never perform multi-document writes without sessions** when transactional guarantees are required.
- **Never fetch unnecessary fields** — use `.select('-password')` or explicit projections to save memory and network bandwidth.
- **Never store passwords in plain text** — always hash with bcrypt.
- **Never store binary files in MongoDB** — save files to S3-compatible storage and store URLs or keys in documents.
- **Never use floating-point types for monetary values** — store as integers (cents) or use `SchemaTypes.Decimal128`.
- **Never use separate Redis variables** (such as `REDIS_HOST`, `REDIS_PORT`, or `REDIS_PASSWORD`) to configure Redis/BullMQ connections — always use the unified `REDIS_URL` connection string.

