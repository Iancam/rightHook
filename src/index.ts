import program from "commander";

import { todoGrammar, Todo, todoQueryGrammar, getCompletions } from "./todo";
import { parse, loadState, Without, persistState, wordInfo } from "./utils";
import tabtab from "tabtab";
import { AppState } from "./state";

export type TabTabEnvParse = {
  complete: boolean;
  words: number;
  point: number;
  line: string;
  partial: string;
  last: string;
  lastPartial: string;
  prev: any;
};

const DEFAULT_STATE: AppState = { listMetaData: {}, lists: {} };

const DEFAULTS = { pullFrom: "todo" };

const parseTodo = parse(todoGrammar);
const parseTodoQuery = parse(todoQueryGrammar);

loadState(DEFAULT_STATE)
  .then((state: AppState) => {
    program
      .command("list <id>")
      .description(
        "without an argument, will print the contents of an existing list"
      )
      .option("-p, --pullFrom <list>", "list to remove from")
      .action((id, { pullFrom }) => {
        const list = state.lists[id];
        if (list) {
          //print list contents
          if (pullFrom) {
            state.lists[id].pullFrom = pullFrom;
          } else {
            console.log(list);
          }
        } else {
          //create a new list
          state.listMetaData[id] = { id, pullFrom: pullFrom || null };
          state.lists[id] = {};
          persistState()(state).catch(err => console.error(err));
        }
      });
    program.command("install-completion").action(() => {
      tabtab
        .install({ name: "todo", completer: "todo" })
        .catch(err => console.error("Install Error", err));
    });
    program.command("uninstall-completion").action(() => {
      tabtab
        .uninstall({ name: "todo" })
        .catch(err => console.error("uninstall Error", err));
    });
    program.command("completion").action(() => {
      // console.log({ tt: tabtab.parseEnv(process.env) });
      console.log(
        getCompletions(state)({
          complete: true,
          partial: "",
          prev: "todo",
          line: "todo ",
          words: 2,
          last: "",
          lastPartial: "",
          point: 7
        })
      );
      // return getCompletions(tabtab.parseEnv(process.env))
    });

    program.command(`todo <listname> <payload>`).action((listname, payload) => {
      const listMetaData = state.listMetaData[listname];
      if (!listMetaData) {
        /** @todo just make a new list, bro */
        throw `list ${listname} doesn't exist.
      Try either 'list <listName> <pullFrom>'
      or any of ${Object.keys(state.listMetaData).join(", ") || "[]"}`;
      }
      const userInput = parseTodo(payload) as Without<
        Without<Todo, "text">,
        "timestamp"
      >;
      const metaData = {
        timestamp: new Date(),
        text: payload
      };
      let newTodo = Todo({ ...userInput, ...metaData });
      // remove old todo if found
      const source = state.lists[listMetaData.pullFrom];
      const shouldMoveTodo = userInput.id && source;
      if (shouldMoveTodo) {
        newTodo = source[userInput.id];
        state.lists[listMetaData.id][newTodo.id] = newTodo;
        source[userInput.id] = undefined;
      }
      // update new list
      state.lists[listMetaData.id][newTodo.id] = newTodo;
      persistState()(state).catch(err => console.error(err));
    });

    return state;
  })
  .then(state => {
    // console.log(__dirname);

    program.parse(process.argv);
  })
  .catch(err => console.error(err));
