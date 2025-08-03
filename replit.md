# Brevia AI - Multi-Agent AI Platform

## Overview

Brevia AI is a full-stack web application that provides specialized AI agents for different tasks including research, note generation, document creation, resume building, and presentation creation. The platform features a modern chat interface where users can interact with different AI agents, each designed for specific workflows and capabilities.

The application is built as a monorepo with a React TypeScript frontend and Express.js backend, utilizing PostgreSQL for data persistence and Drizzle ORM for database operations. The platform supports real-time agent workflows with progress tracking and multi-source content generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for development
- **UI Components**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Layout**: Three-panel layout with left sidebar for agent selection, center panel for chat, and right panel for sources/exports

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints with structured error handling and request logging
- **Agent System**: Abstract base agent class with specialized implementations for different tasks
- **Workflow Management**: Step-by-step progress tracking with status updates
- **Storage Layer**: Interface-based storage abstraction for flexible data access

### Database Architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Design**: Normalized tables for users, chat sessions, messages, workflows, documents, sources, and logs
- **Data Types**: JSONB for flexible metadata storage and workflow steps
- **Relationships**: Foreign key constraints linking sessions to users, messages to sessions, etc.

### AI Integration
- **Primary Provider**: Hugging Face Inference API for text generation and embeddings
- **Model Support**: Multiple models including Llama 3.3, Falcon3, and Mistral
- **Vector Database**: Simple in-memory implementation for development (designed for easy production replacement)
- **Agent Types**: Specialized agents for research, notes, documents, resume, and presentations

### Authentication & Session Management
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple
- **User Management**: Basic user system with username/password authentication
- **Authorization**: Session-based authentication with user context

### Real-time Features
- **Polling**: Client-side polling for workflow updates and message synchronization
- **Progress Tracking**: Real-time agent workflow status with step-by-step progress
- **Status Indicators**: Visual feedback for agent states and processing status

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18+ with TypeScript, Vite for bundling and development
- **UI Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS for utility-first styling with PostCSS

### Backend Dependencies
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM and Drizzle Kit for migrations
- **Session Management**: connect-pg-simple for PostgreSQL session storage

### AI and ML Services
- **Hugging Face**: Primary AI provider using @neondatabase/serverless for database connections
- **Vector Search**: In-memory vector database (production-ready alternatives: Pinecone, Chroma, Weaviate)
- **Text Processing**: Built-in text processing with support for PDF parsing and content extraction

### Development Tools
- **TypeScript**: Full TypeScript support across frontend and backend
- **Build Tools**: ESBuild for production builds, Vite for development
- **Database Tools**: Drizzle Kit for schema management and migrations
- **Development Environment**: Replit-specific plugins for development experience

### Third-party Integrations
- **Database Provider**: Neon Database for PostgreSQL hosting
- **File Processing**: Support for PDF analysis and document generation
- **Export Formats**: Multiple export formats for generated content
- **Web Scraping**: Planned integration for research agent web search capabilities