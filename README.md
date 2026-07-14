# AI Architecture Agent

##  Frontend Architecture

The frontend for the AI Architecture Agent is built as a lightweight, lightning-fast Single Page Application (SPA) using **Vanilla Web Technologies** (HTML5, CSS3, JavaScript). By avoiding heavy frameworks, the UI remains highly performant and requires zero build steps to run.

###  Key Features

* **Whimsical-Style UI:** A modern, light-themed interface featuring organic shapes, soft gradients, and glassmorphism elements.
* **Interactive Architecture Canvas:** A visual workspace where cloud infrastructure nodes (API Gateways, Databases, Lambdas) are rendered and connected via SVG bezier curves.
* **Ask AI Panel:** A slide-out chat interface featuring streaming text animations and quick-action prompts (e.g., "Design AWS backend", "Optimize Cost") to simulate real-time AI collaboration.
* **Agent Detail Drawer:** A comprehensive inspection panel for selected architecture nodes, displaying:
  * **Overview:** Node technology, version, region, and connections.
  * **API Routes:** Swagger-style badges detailing HTTP methods and endpoints.
  * **Terraform Code:** An embedded syntax-highlighted code viewer with a one-click copy function.
* **Seamless SPA Navigation:** Fluid transitions between the main Dashboard (recent boards, templates) and the Board Editor canvas.

### Getting Started

Because the frontend is built with vanilla HTML/CSS/JS, there is no `npm install` or complex build process required.
I have builed two ways to open the frontend dashboard :  
**Option 1: Direct File Open (Quickest)**
Navigate to the `frontend/` directory and double-click `index.html` to open it directly in your preferred web browser.

**Option 2: Using VS Code Live Server**
1. Open this repository in Visual Studio Code.
2. Install the **"Live Server"** extension.
3. Right-click on `frontend/index.html` and select **"Open with Live Server"**.

### File Structure 

The frontend code is organized within the `frontend/` directory:

* `index.html`: The structural foundation and layout of the SPA.
* `styles.css`: The complete styling system, including the Whimsical theme and CSS animations.
* `app.js`: The core controller handling UI state, tab switching, AI chat simulations, and SVG canvas rendering.
* `data.js`: The mock data layer that serves predefined board layouts, AI responses, and Terraform snippets.
