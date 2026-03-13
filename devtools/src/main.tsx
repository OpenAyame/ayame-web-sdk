import { render } from "preact";
import App from "./App";
import "./index.css"; // eslint-disable-line import/no-unassigned-import -- CSS import

const root = document.querySelector("#root");
if (root !== null) {
  render(<App />, root);
}
