"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Create a new express application instance
const app = (0, express_1.default)();
// Set the network port
const port = process.env.PORT || 3000;
// Define the root path with a greeting message
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Express + TypeScript Server dsfsdfds!" });
});
// Start the Express server
app.listen(port, () => {
    console.log(`The server is running at http://localhost:${port}`);
});
