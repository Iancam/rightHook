import prog, { CommanderStatic } from "commander";
import mixin from "commander-completion";
import {
  todoGrammar,
  Todo,
  todoList,
  todoQueryGrammar,
  completeTodo
} from "./todo";
import { safeDump, safeLoad } from "js-yaml";
import { promisify } from "util";
import { readFile } from "fs";
import { parse, loadCollection } from "./utils";

const CONFIG_DATA = "configData.yml";
const program: CommanderStatic = mixin(prog);

const parseTodo = parse(todoGrammar);
const parseTodoQuery = parse(todoQueryGrammar);

promisify(readFile)(CONFIG_DATA)
  .then(yml => (safeLoad(yml.toString()) || {}) as todoList)
  .then(lists =>
    lists.forEach((list, index) => {
      program
        .command(`${list.name} <payload>`)
        .action(payload => {
          const userInput = parseTodo(payload);
          const metaData = {
            timestamp: new Date(),
            text: payload
          };
        })
        .completion(completeTodo(list, index, lists, parseTodoQuery));
    })
  );
