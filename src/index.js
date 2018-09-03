import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { observe } from "./State";

import "./index.css";

const rootEl = document.getElementById("root");

observe((cards, isDragging) =>
  ReactDOM.render(<App cards={cards} isDragging={isDragging} />, rootEl)
);
