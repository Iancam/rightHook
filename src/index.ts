import prog, { CommanderStatic } from "commander";
import mixin from "commander-completion";
import { todoGrammar, Todo, todoQueryGrammar } from "./todo";
import {
  parse,
  getSourceId,
  loadState,
  AppState,
  Without,
  persistState
} from "./utils";

const DEFAULT_STATE: AppState = { listMetaData: {}, lists: {} };

const DEFAULTS = { pullFrom: "todo" };

const program: CommanderStatic = mixin(prog);

const parseTodo = parse(todoGrammar);
const parseTodoQuery = parse(todoQueryGrammar);

loadState(DEFAULT_STATE)
  .then((state: AppState) => {
    program
      .command("list <id>")
      .option("-p, --pullFrom <list>", "list to remove from")
      .action((id, { pullFrom }) => {
        if (state.listMetaData[id]) throw `list ${id} already exists`;
        else {
          state.listMetaData[id] = { id, pullFrom: pullFrom || null };
          state.lists[id] = {};

          persistState()(state).catch(err => console.error(err));
        }
      });

    program.command(`todo <listname> <payload>`).action((listname, payload) => {
      const listMetaData = state.listMetaData[listname];
      if (!listMetaData) {
        throw `list ${listname} doesn't exist.
      Try either 'list <listName> <pullFrom>'
      or any of ${Object.keys(state.listMetaData).join(", ") || "[]"}`;
      }
      const source = state.lists[listMetaData.pullFrom];

      const userInput = parseTodo(payload) as Without<
        Without<Todo, "text">,
        "timestamp"
      >;
      const metaData = {
        timestamp: new Date(),
        text: payload
      };

      let newTodo = Todo({ ...userInput, ...metaData });

      if (userInput.id && source) {
        newTodo = source[userInput.id];
        state.lists[listMetaData.id][newTodo.id] = newTodo;
        source[userInput.id] = undefined;
      }
      state.lists[listMetaData.id][newTodo.id] = newTodo;
      persistState()(state).catch(err => console.error(err));
    });
    // .completion(completeTodo(list, index, lists, parseTodoQuery));
    return state;
  })
  .then(state => {
    console.log(__dirname);

    program.parse(process.argv);
  })
  .catch(err => console.error(err));
