// Initialize GitHub AI Platform Database

// Switch to our database
db = db.getSiblingDB('github_ai_dev');

// Create collections with validation
db.createCollection('repositories', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'owner', 'url', 'primaryLanguage'],
      properties: {
        name: { bsonType: 'string' },
        owner: { bsonType: 'string' },
        url: { bsonType: 'string' },
        primaryLanguage: { bsonType: 'string' },
        isPrivate: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('analysis_results', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['repositoryId', 'category', 'severity'],
      properties: {
        repositoryId: { bsonType: 'string' },
        category: { bsonType: 'string' },
        severity: { bsonType: 'string' },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('ai_insights');
db.createCollection('users');

// Create indexes for better performance
db.repositories.createIndex({ "owner": 1, "name": 1 }, { unique: true });
db.repositories.createIndex({ "analyzedAt": 1 });
db.analysis_results.createIndex({ "repositoryId": 1 });
db.analysis_results.createIndex({ "category": 1, "severity": 1 });
db.ai_insights.createIndex({ "repositoryId": 1 });

// Insert default admin user
db.users.insertOne({
  email: 'admin@github-ai-platform.com',
  name: 'Admin User',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('GitHub AI Platform database initialized successfully!');
