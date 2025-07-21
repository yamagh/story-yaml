# Story YAML

## What is Story YAML?

Story YAML is a structured format for defining and managing software development projects using YAML. It allows you to represent high-level concepts like **Epics**, break them down into user-centric **Stories**, and further divide them into actionable **Tasks** and **Sub-Tasks**. This human-readable format serves as a single source of truth for your project's backlog, making it easy to track progress and maintain clarity.

This VS Code extension provides an interactive user interface to visualize, edit, and manage your `story.yaml` file. Instead of editing the YAML text directly, you can use the webview to:
- See a high-level overview of your project.
- Add, edit, and delete items.
- Track the status, points, and sprint assignments for each item.

## Sample `story.yaml`

To help you understand the structure, here is a sample of a `story.yaml` file. It defines an epic, which contains stories, and a standalone task with sub-tasks.

```yaml
epics:
  - title: User Authentication
    description: Implement a complete user authentication system.
    stories:
      - title: User Registration
        as: a new user
        i want: to create an account
        so that: I can access the platform.
        description: "Allow users to sign up using their email and password."
        status: ToDo
        points: 5
        sprint: Sprint 1
        definition of done:
          - User can register with a unique email.
          - A confirmation email is sent upon registration.
      - title: User Login
        as: a registered user
        i want: to log in to my account
        so that: I can use the application's features.
        description: "Provide a secure login form for returning users."
        status: ToDo
        points: 3
        sprint: Sprint 1
        definition of done:
          - User can log in with correct credentials.
          - An error message is shown for invalid credentials.

tasks:
  - title: Set up the development environment
    description: "Configure the necessary tools and libraries for the project."
    status: Done
    points: 2
    sprint: Sprint 0
    sub tasks:
      - title: Install Node.js and npm
        description: "Use Devbox to ensure consistent versions."
        status: Done
      - title: Set up ESLint and Prettier
        description: "Configure linting and code formatting rules."
        status: Done
```

## Preview

The following image shows the interactive webview for editing the `story.yaml` file.

![Story YAML Preview](https://raw.githubusercontent.com/yamagh/story-yaml/main/docs/images/preview.png)

## Usage

The primary way to use this extension is through the `story.yaml` file and the command palette.

1. **Create a story file**:
  Create a `story.yaml` file in your project's root directory. You can use the provided snippets to get started (type `epic` or `task` in a YAML file).

2. **Open the Preview**:
  Open the command palette (`Shift+Cmd+P` on macOS or `Shift+Ctrl+P` on Windows/Linux) and run the **`Story YAML: Preview`** command. This will open the interactive webview.

## Extension Settings

This extension does not currently contribute any custom settings.

## Motivation

Story YAML is a VS Code extension that facilitates **Story-Driven Development (SDD)**. It allows developers to manage user stories, tasks, and epics in a structured YAML format and visualize them in an interactive webview. This approach, combined with AI-powered assistance, aims to streamline the development process from conception to implementation.
