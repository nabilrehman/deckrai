import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

/**
 * Architecture patterns we support
 */
export type ArchitectureType =
  | 'microservices'
  | 'hexagonal'
  | 'layered'
  | 'event-driven'
  | 'serverless'
  | 'monolith'
  | 'client-server'
  | 'pipe-filter'
  | 'model-view-controller'
  | 'clean-architecture'
  | 'domain-driven-design'
  | 'service-oriented';

/**
 * Detect architecture type from natural language
 */
export async function detectArchitectureType(prompt: string): Promise<ArchitectureType | null> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const detectionPrompt = `You are an expert in software architecture patterns.
Analyze this user prompt and determine which architecture pattern they're referring to.

User prompt: "${prompt}"

Return ONLY one of these architecture types (or "none" if no architecture is mentioned):
- microservices
- hexagonal
- layered
- event-driven
- serverless
- monolith
- client-server
- pipe-filter
- model-view-controller
- clean-architecture
- domain-driven-design
- service-oriented

Examples:
"Create an architecture slide showing microservices" → microservices
"Add a slide about hexagonal architecture" → hexagonal
"Show our tech stack in layers" → layered
"Explain our event-driven system" → event-driven
"Create a pricing slide" → none

Return ONLY the architecture type or "none", nothing else.`;

  const result = await model.generateContent(detectionPrompt);
  const response = result.response.text().trim().toLowerCase();

  if (response === 'none') {
    return null;
  }

  return response as ArchitectureType;
}

/**
 * Generate architecture slide specification
 */
export async function generateArchitectureSlide(
  architectureType: ArchitectureType,
  context: string,
  styleReference?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  });

  const architecturePrompts: Record<ArchitectureType, string> = {
    microservices: `
Layout: Distributed system with multiple service boxes
Components:
- API Gateway (top center)
- 6-8 microservice boxes (arranged in grid)
- Message queue/Service mesh (connecting lines)
- Database per service (small icons)
Visual style: Clean boxes with icons, dotted lines for communication
Colors: Blue for services, green for databases, purple for message queue`,

    hexagonal: `
Layout: Hexagon in center with ports on sides
Components:
- Core Domain (center hexagon)
- Input Ports (left side): REST API, GraphQL, Message Queue
- Output Ports (right side): Database, External APIs, File Storage
- Adapters (outer layer): Controller, Repository, Gateway
Visual style: Geometric hexagon with connection points
Colors: Purple center, blue ports, green adapters`,

    layered: `
Layout: Horizontal layers stacked vertically
Components:
- Presentation Layer (top): UI, Components
- Application Layer: Business Logic, Services
- Domain Layer: Entities, Value Objects
- Infrastructure Layer (bottom): Database, APIs, External Services
Visual style: Gradient boxes, clear separation lines
Colors: Gradient from light blue (top) to dark blue (bottom)`,

    'event-driven': `
Layout: Event flow from left to right
Components:
- Event Producers (left): User Actions, System Events
- Event Bus/Stream (center): Kafka, RabbitMQ, EventBridge
- Event Consumers (right): Services, Handlers, Listeners
- Event Store (bottom): Event log, Snapshots
Visual style: Flow arrows, message bubbles
Colors: Orange for events, blue for consumers, purple for bus`,

    serverless: `
Layout: Cloud-native components
Components:
- API Gateway (top)
- Lambda/Cloud Functions (middle, multiple boxes)
- Managed Services (bottom): DynamoDB, S3, SQS
- Event triggers: HTTP, Schedule, Queue
Visual style: Cloud icons, serverless badge, auto-scaling indicators
Colors: AWS/Azure/GCP brand colors, cloud blue background`,

    monolith: `
Layout: Single large box with internal modules
Components:
- Single Application Container (large box)
- Internal Modules: Auth, Business Logic, Data Access
- Shared Database (bottom)
- Load Balancer (top)
Visual style: Unified box with dotted internal divisions
Colors: Single dominant color, subtle internal shading`,

    'client-server': `
Layout: Two-tier architecture
Components:
- Client Tier (left): Web Browser, Mobile App, Desktop
- Server Tier (right): Application Server, Database Server
- Network (center): HTTP/HTTPS, WebSocket
Visual style: Two distinct zones, bidirectional arrows
Colors: Blue for client, green for server`,

    'pipe-filter': `
Layout: Linear processing pipeline
Components:
- Input Source (left)
- Filter 1: Data Validation
- Filter 2: Transformation
- Filter 3: Enrichment
- Filter 4: Aggregation
- Output Destination (right)
Visual style: Pipes connecting filter boxes, data flow indicators
Colors: Gradient flow, different color per filter`,

    'model-view-controller': `
Layout: MVC triangle
Components:
- Model (bottom left): Data, Business Logic, Database
- View (bottom right): UI, Templates, Components
- Controller (top): Request Handler, Router
Visual style: Triangle with bidirectional arrows
Colors: Green for Model, Blue for View, Purple for Controller`,

    'clean-architecture': `
Layout: Concentric circles (onion architecture)
Components:
- Core (center): Entities, Use Cases
- Layer 2: Interface Adapters, Controllers, Presenters
- Layer 3: Frameworks & Drivers, UI, Database, External APIs
Visual style: Circular layers, dependency arrows pointing inward
Colors: Gradient from dark center to light outer`,

    'domain-driven-design': `
Layout: Bounded contexts with aggregates
Components:
- Bounded Context 1: Order Management (Entities, Value Objects)
- Bounded Context 2: Inventory (Aggregates, Services)
- Bounded Context 3: Shipping
- Context Map (connections between contexts)
Visual style: Rounded rectangles for contexts, dotted lines for relationships
Colors: Different color per bounded context`,

    'service-oriented': `
Layout: Service registry with multiple services
Components:
- Service Registry/ESB (center)
- Business Services: Order Service, Payment Service, User Service
- Data Services: Customer DB, Product DB
- Integration Services: Email, SMS, Analytics
Visual style: Hub-and-spoke pattern, service boxes around center
Colors: Purple for registry, blue for services, green for data`
  };

  const prompt = `You are an expert presentation designer specializing in technical architecture diagrams.

Task: Create a slide showing ${architectureType.replace(/-/g, ' ')} architecture

Context from user: ${context}

Architecture Pattern Guidelines:
${architecturePrompts[architectureType]}

${styleReference ? `Style Reference: Match the design style of: ${styleReference}` : ''}

Generate a detailed slide specification with:

1. TITLE: Clear, descriptive title (e.g., "Microservices Architecture Overview")

2. LAYOUT:
   - Component positions (use % coordinates)
   - Visual hierarchy
   - Spacing and alignment

3. COMPONENTS:
   - List each architectural component
   - Position, size, and styling for each
   - Connection lines/arrows between components
   - Icons or visual indicators

4. TEXT ANNOTATIONS:
   - Brief labels for each component
   - Optional: Key characteristics or benefits

5. VISUAL STYLE:
   - Color scheme (use hex codes)
   - Typography (sizes, weights)
   - Shadows, borders, backgrounds
   - Diagram style (boxes, circles, etc.)

6. DESIGN NOTES:
   - Why this layout works for ${architectureType}
   - Visual metaphors used
   - Accessibility considerations

Return a complete, implementable specification that a designer or AI image generator could use to create this slide.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Examples of conversational prompts that should trigger architecture slides
 */
export const ARCHITECTURE_EXAMPLES = [
  'Create an architecture slide showing microservices',
  'Add a slide about our hexagonal architecture',
  'Show the layered architecture of our system',
  'Create a slide explaining our event-driven design',
  'Add an architecture diagram for serverless',
  'Show how our monolith is structured',
  'Create a client-server architecture slide',
  'Add a pipeline architecture slide',
  'Show our MVC pattern',
  'Create a clean architecture diagram',
  'Add a slide about domain-driven design',
  'Show our service-oriented architecture'
];

/**
 * Integration with chat: Parse user message for architecture intent
 */
export async function handleArchitectureRequest(
  userMessage: string,
  styleReference?: string
): Promise<{
  isArchitectureRequest: boolean;
  architectureType?: ArchitectureType;
  specification?: string;
}> {
  // Detect if this is an architecture request
  const architectureType = await detectArchitectureType(userMessage);

  if (!architectureType) {
    return { isArchitectureRequest: false };
  }

  // Generate the architecture slide specification
  const specification = await generateArchitectureSlide(
    architectureType,
    userMessage,
    styleReference
  );

  return {
    isArchitectureRequest: true,
    architectureType,
    specification
  };
}
