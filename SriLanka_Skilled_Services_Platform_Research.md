# Sri Lanka On-Demand Skilled Services Platform

## Research, Product Strategy, and Development Roadmap

### Project Vision

Build a location-based marketplace that connects customers with nearby
skilled service providers across Sri Lanka.

Examples of service providers:

-   Electricians
-   Plumbers
-   Welders
-   Carpenters
-   Mechanics
-   Auto AC technicians
-   Home AC technicians
-   Painters
-   Masons
-   CCTV installers
-   Solar technicians
-   Cleaning professionals

The platform should initially launch as a **mobile-first web application
(Progressive Web App - PWA)** and later expand into dedicated Android
and iOS applications.

------------------------------------------------------------------------

## Problem Statement

### Customer Problems

-   Difficult to find reliable service providers quickly.
-   Most people depend on Facebook groups, WhatsApp, or personal
    contacts.
-   No transparent pricing.
-   No service quality guarantee.
-   No easy way to compare providers.
-   Limited availability during emergencies.

### Service Provider Problems

-   Difficulty finding new customers.
-   Limited digital presence.
-   No centralized booking system.
-   Time wasted on fake inquiries.
-   No reputation-building mechanism.

------------------------------------------------------------------------

## Proposed Solution

Create an "Uber for Skilled Workers" platform.

Users can:

1.  Open the app or website.
2.  Share their location.
3.  Select a service category.
4.  Describe the issue.
5.  Upload photos or videos.
6.  Receive matched providers nearby.
7.  Compare ratings and prices.
8.  Book the service.
9.  Track job progress.
10. Complete payment and leave reviews.

------------------------------------------------------------------------

## Market Opportunity in Sri Lanka

Existing platforms include:

-   Blu.lk
-   Fixie.lk
-   SourceTradesman
-   Waddo
-   FindMe Service Finder

### Market Gaps

-   Most platforms focus mainly on Colombo.
-   Limited category coverage.
-   Low brand awareness.
-   Small provider networks.
-   Weak user experience.
-   Minimal coverage outside urban areas.

This creates an opportunity for a nationwide, multilingual platform.

------------------------------------------------------------------------

## Target Audience

### Customers

-   Homeowners
-   Apartment residents
-   Offices
-   Small businesses
-   Vehicle owners
-   Sri Lankans living overseas who manage family properties

### Service Providers

-   Individual technicians
-   Small service businesses
-   Freelancers
-   Workshops
-   Maintenance companies

------------------------------------------------------------------------

## Unique Value Proposition

> Find verified skilled professionals near your location within minutes.

Key differentiators:

-   Real-time location matching
-   Verified providers
-   Multilingual support (Sinhala, Tamil, English)
-   Transparent pricing
-   Emergency services
-   Service warranties

------------------------------------------------------------------------

## Core Features

### Customer Features

-   User registration and login
-   OTP authentication
-   GPS location detection
-   Service search and filtering
-   Photo and video uploads
-   Booking management
-   In-app chat and calling
-   Live job tracking
-   Digital payments
-   Ratings and reviews
-   Booking history

### Service Provider Features

-   Provider onboarding
-   NIC verification
-   Skill certificate uploads
-   Service area selection
-   Availability management
-   Job acceptance and rejection
-   Earnings dashboard
-   Customer communication
-   Review management

### Admin Features

-   User management
-   Provider verification
-   Category management
-   Dispute resolution
-   Analytics dashboard
-   Revenue tracking
-   Fraud detection

------------------------------------------------------------------------

## Trust and Safety Features

Trust is critical for success.

Required features:

-   NIC verification
-   Selfie verification
-   Police clearance (optional)
-   Trade certification uploads
-   Ratings and reviews
-   Job completion photos
-   Call masking
-   In-app messaging
-   Emergency support
-   Secure payment processing

------------------------------------------------------------------------

## Matching Algorithm

The platform should match providers using:

-   Customer location
-   Provider location
-   Service category
-   Availability
-   Rating score
-   Response time
-   Price range

### Example

Customer: Colombo 02

Service: AC repair

Radius: 5 km

Result: Available technicians ranked by proximity and quality.

------------------------------------------------------------------------

## Revenue Model

### Option 1: Commission Model

Charge 10%--15% per completed booking.

### Option 2: Lead Fee Model

Providers pay for customer leads.

### Option 3: Subscription Model

Premium provider plans:

-   Verified badge
-   Higher search ranking
-   More leads
-   Business analytics

### Option 4: Advertising

Advertising opportunities for:

-   Hardware stores
-   Tool suppliers
-   Insurance providers

### Option 5: Service Warranty Fees

Offer extended service guarantees.

------------------------------------------------------------------------

# Recommended Development Approach

## Why Start with a Web Application?

Benefits:

-   Lower development cost
-   Faster launch
-   Single codebase
-   Easier maintenance
-   No app store approval delays
-   Works on all devices

Use a Progressive Web App (PWA) approach.

------------------------------------------------------------------------

# Development Phases

## Phase 0: Research and Validation (2--4 Weeks)

Objectives:

-   Interview 50 customers.
-   Interview 50 service providers.
-   Validate pricing expectations.
-   Identify the highest-demand categories.
-   Create a landing page.
-   Test bookings manually using WhatsApp.

Deliverables:

-   Customer insights report
-   Provider insights report
-   MVP requirements document

Success Metrics:

-   100+ interested users
-   30+ verified providers

------------------------------------------------------------------------

## Phase 1: MVP Planning and Design (2 Weeks)

Activities:

-   Create user journeys
-   Design wireframes
-   Create UI/UX prototypes
-   Define database schema
-   Prepare technical architecture

Tools:

-   Figma
-   Miro
-   Notion

Deliverables:

-   Design system
-   Clickable prototype
-   Product requirements document

------------------------------------------------------------------------

## Phase 2: Build the MVP Web Application (8--12 Weeks)

### Customer Module

-   Registration
-   OTP login
-   Service booking
-   Provider search
-   Ratings and reviews

### Provider Module

-   Registration
-   Verification workflow
-   Job management
-   Earnings dashboard

### Admin Module

-   User management
-   Provider approvals
-   Analytics

Deliverables:

-   Fully functional PWA
-   Admin dashboard
-   Production database

------------------------------------------------------------------------

## Phase 3: Pilot Launch (4 Weeks)

Launch in one city:

Recommended locations:

-   Colombo
-   Gampaha
-   Kandy

Initial categories:

-   Electricians
-   Plumbers
-   AC technicians

Objectives:

-   Monitor user behavior
-   Improve matching quality
-   Collect reviews
-   Optimize onboarding

Success Metrics:

-   100 providers
-   1,000 customers
-   500 completed jobs

------------------------------------------------------------------------

## Phase 4: Scale Across Sri Lanka (3--12 Months)

Expand:

-   New districts
-   New service categories
-   Corporate accounts

Introduce:

-   Fixed-price services
-   Subscription plans
-   Emergency support

------------------------------------------------------------------------

## Phase 5: Mobile Applications

Build dedicated apps after achieving product-market fit.

Platforms:

-   Android
-   iOS

Recommended technologies:

-   React Native
-   Flutter

Features:

-   Push notifications
-   Offline capabilities
-   Improved performance

------------------------------------------------------------------------

# Recommended Technology Stack

## Frontend

-   Next.js
-   React
-   Tailwind CSS
-   TypeScript

## Backend

-   Node.js
-   Express.js

## Database

-   PostgreSQL

## Authentication

-   Firebase Authentication
-   OTP login

## Maps and Location

-   Google Maps API
-   OpenStreetMap

## Cloud Storage

-   AWS S3
-   Cloudinary

## Notifications

-   Firebase Cloud Messaging

## Payments

-   PayHere
-   Genie Business

## Hosting

-   AWS
-   DigitalOcean
-   Vercel

------------------------------------------------------------------------

# High-Level System Architecture

Customer App → API Gateway → Backend Services → Database

Provider App → API Gateway → Backend Services → Database

Admin Dashboard → API Gateway → Backend Services → Database

Third-party integrations:

-   Payment gateway
-   Maps API
-   SMS provider
-   Push notifications

------------------------------------------------------------------------

# Go-To-Market Strategy

## Provider Acquisition

Acquire providers through:

-   Facebook groups
-   WhatsApp communities
-   Hardware stores
-   Vehicle repair shops
-   Technical colleges
-   Trade associations

## Customer Acquisition

-   Facebook ads
-   TikTok marketing
-   Referral programs
-   Local partnerships
-   SEO

------------------------------------------------------------------------

# Key Risks

-   Provider supply shortage
-   Trust and safety concerns
-   Fake bookings
-   Pricing disputes
-   Low retention rates

Mitigation:

-   Strong verification process
-   Customer support team
-   Provider training
-   Service warranties

------------------------------------------------------------------------

# Key Success Metrics

-   Monthly active users
-   Completed bookings
-   Average response time
-   Customer retention rate
-   Provider retention rate
-   Customer satisfaction score
-   Revenue per booking

------------------------------------------------------------------------

# Long-Term Vision

Transform the platform into a complete service ecosystem covering:

-   Home services
-   Vehicle services
-   Construction services
-   Cleaning services
-   Freelance technical work

Goal:

Become Sri Lanka's leading on-demand services marketplace.

------------------------------------------------------------------------

# Final Recommendation

Do not start with mobile apps.

Start with:

1.  Market validation
2.  Mobile-first PWA
3.  Pilot launch in one city
4.  Expand categories
5.  Launch Android and iOS apps

Focus on solving trust, provider acquisition, and service quality before
scaling.


## Documentation Updates for Solar Services

Update the following documents to include Solar Services:

- PRD
- User Personas
- SRS
- Database Design
- API Documentation
- Sprint Plan
- Go-To-Market Strategy

Example service category:

```text
Solar Services
├── Solar Installation
├── Solar Maintenance
├── Solar Cleaning
├── Inverter Repair
├── Battery Replacement
├── Net Metering Support
└── EV Charger Installation
```
