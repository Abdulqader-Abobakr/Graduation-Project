# Sila — Digital Services & Entrepreneurship Platform

Sila is a web-based platform designed to connect companies with freelancers who provide professional and digital services.

The platform provides a structured environment where companies can discover freelancers, publish service requests, review proposals, communicate with freelancers, and manage projects. Freelancers can build their professional profiles, showcase their portfolios and specialties, discover available opportunities, submit proposals, manage projects and deliverables, and track their earnings.

## Project Overview

The goal of Sila is to provide a centralized platform for managing the relationship between companies and independent service providers throughout the project lifecycle.

Instead of limiting the platform to finding a freelancer, Sila covers multiple stages of the process:

**Discover → Request → Proposal → Communication → Project → Deliverables → Payment → Withdrawal**

The first phase of the system focuses on establishing the core platform infrastructure and implementing the main workflows for both companies and freelancers.

## Main Users

### Companies

Companies can:

* Create and manage a company profile
* Explore available freelancers
* Create service requests (briefs)
* Make requests publicly available or target a specific freelancer
* Receive and review freelancer proposals
* Accept or reject proposals
* Communicate with freelancers
* Track projects and submitted deliverables

### Freelancers

Freelancers can:

* Create and manage a professional profile
* Add professional specialties and experienced sectors
* Create and manage portfolio entries
* Browse available service requests
* Search for relevant opportunities
* Submit project proposals
* Define project pricing, timeline, revisions, and terms
* Break proposals into milestones
* Manage active projects
* Submit project deliverables
* Respond to revision requests
* Track earnings and transactions
* Submit withdrawal requests

## Core Workflow

A typical project can move through the following process:

```text
Company
   │
   ▼
Create Service Request
   │
   ▼
Freelancers Discover Request
   │
   ▼
Freelancer Submits Proposal
   │
   ▼
Company Reviews Proposal
   │
   ├── Reject
   │
   └── Accept
          │
          ▼
      Project Created
          │
          ▼
    Project Deliverables
          │
          ▼
   Freelancer Submits Work
          │
          ▼
     Client Review
          │
       ┌──┴──┐
       │     │
    Revision  Approved
       │     │
       └─────┘
          │
          ▼
    Project Completion
```

## Main Features

### Authentication & User Management

* Freelancer and company registration
* Login and logout
* Role-based access
* Session-based authentication
* Supabase authentication integration
* Identity-document upload during registration

### Company Management

* Company profile
* Company settings
* Freelancer discovery
* Service request creation
* Service request editing and deletion
* Public or freelancer-specific requests
* Proposal review
* Proposal acceptance/rejection
* Company–freelancer conversations

### Freelancer Management

* Freelancer profile
* Professional biography and job title
* Marketing specialties
* Experienced sectors
* Portfolio management
* Freelancer discovery
* Opportunity search

### Proposals & Negotiation

Freelancers can create proposals containing:

* Project title
* Price
* Timeline
* Revision limit
* Proposal validity
* Additional terms
* Project milestones

Companies can review submitted proposals and either accept or reject them.

### Project Management

When a company accepts a proposal, the platform creates an associated project.

Projects support:

* Active and completed project states
* Deliverables/tasks
* Progress calculation
* Sequential task workflow
* File submissions
* External links
* Notes
* Client feedback
* Revision requests
* Project completion

### Communication

The platform provides company–freelancer conversations associated with projects and proposals.

Users can exchange messages and view conversation history directly through the platform.

### Earnings & Withdrawals

Freelancers have access to an earnings section containing:

* Available balance
* Pending balance
* Lifetime earnings
* Verified project transactions
* Transaction history
* Monthly earnings data
* Daily earnings data
* Withdrawal requests

Supported withdrawal methods currently include bank, Jeeb, and local withdrawal options.

## Technology Stack

### Backend

* **Laravel**
* PHP
* Laravel Eloquent ORM
* Laravel validation
* Laravel sessions
* Laravel controllers and middleware

### Frontend

* **React**
* **Inertia.js**
* Tailwind CSS
* Vite
* Lucide icons

The frontend uses React pages/components while Inertia connects the React interface with the Laravel backend.

### Authentication & Storage

* **Supabase Authentication**
* **Supabase Storage**
* S3-compatible storage integration

Supabase is used for authentication and application file storage, while Laravel manages application logic and local user/profile data.

### Database

The application uses a relational PostgreSQL-based database structure containing entities such as:

* Users
* Freelancers
* Client companies
* Portfolios
* Briefs
* Proposals
* Proposal milestones
* Projects
* Deliverables
* Conversations
* Messages
* Transactions
* Wallets
* Withdrawal requests

## Application Architecture

The application follows a Laravel backend architecture with React-based frontend interfaces.

```text
                 ┌──────────────────────┐
                 │      React UI        │
                 │  Company / Freelancer│
                 └──────────┬───────────┘
                            │
                         Inertia
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Laravel Routes     │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │     Controllers      │
                 │ Authentication       │
                 │ Company              │
                 │ Freelancer           │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Eloquent Models    │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    PostgreSQL DB     │
                 └──────────────────────┘

                  ┌───────────────────┐
                  │     Supabase      │
                  │ Auth + Storage    │
                  └───────────────────┘
```

## Role-Based Access

The application separates the two primary user roles.

```text
                         Sila
                          │
              ┌───────────┴───────────┐
              │                       │
           Company                Freelancer
              │                       │
       Company Dashboard       Freelancer Dashboard
              │                       │
       Manage Requests          Find Opportunities
       Review Proposals         Submit Proposals
       Manage Projects          Manage Projects
       Communicate              Manage Portfolio
                                Track Earnings
```

Routes are protected using authentication and role middleware so that company and freelancer functionality is separated.

## Security & Validation

The application performs server-side validation for major operations, including:

* Registration data
* Email addresses
* Password requirements
* Uploaded documents
* Profile information
* Service requests
* Proposals
* Deliverables
* Messages
* Withdrawal requests

Authorization checks are also applied to ensure users can access resources associated with their own accounts.

## Project Status

This repository represents the **first phase of development** of the Sila platform.

The first phase establishes the main application structure and implements the core interaction between companies and freelancers, including authentication, profiles, service requests, proposals, projects, communication, deliverables, and freelancer earnings.

Some areas are still under development and may contain placeholder data or TODO items as the project continues to evolve.

## Future Development

Potential future development areas include:

* More complete payment processing
* Automated payment verification
* Reviews and ratings
* Improved project analytics
* Notifications
* More advanced freelancer discovery and matching
* Administrative management
* Additional entrepreneurship-focused features
* Improved reporting and monitoring
* Production deployment and optimization

## Project Structure

The main Laravel application follows a conventional structure:

```text
app/
├── Http/
│   └── Controllers/
│       ├── Auth/
│       ├── Company/
│       └── Freelancer/
│
├── Models/
└── Services/

resources/
├── js/
│   ├── company_side/
│   └── freelancer/
│
└── css/

routes/
└── web.php

config/
└── ...
```

## Important Note

This project is currently a development/academic project and should not be considered a production-ready marketplace without further security review, payment implementation, testing, infrastructure configuration, and deployment hardening.
