import { Grammar, Without } from "./utils";
import _ from "lodash";
import uuidv5 from "uuid/v5";
import { TabTabEnvParse } from ".";
import chalk from "chalk";
import { AppState } from "./state";
import tabtab from "tabtab";
// import _ from "lodash";

export interface todoGrammar extends Grammar {
  categories: RegExp;
  people: RegExp;
  // when: (text: string) => Date[];
}

export interface todoQueryGrammar extends Grammar {
  categories: RegExp;
  people: RegExp;
}

export type grammarResult<T extends Grammar> = {
  [x in keyof T]: string[] | undefined
};

export const todoGrammar: todoGrammar = {
  categories: /(\w+): /g,
  people: /@(\w+)[ \n$]/g,
  id: /__([\w]+)/g
  // when: text => new Chrono().parse(text, new Date()).map(v => v.start.date())
};

export const todoQueryGrammar: todoQueryGrammar = {
  categories: /:(\w+)/g,
  people: todoGrammar.people,
  id: /__([\w]+)/g
};

export type Bet<T> = {
  type: string;
  guess: T;
  actual: T;
};

export type Todo = {
  id: string;
  categories?: string[];
  people?: string[];
  times?: Date[];
  text: string;
  bets?: Bet<any>[];
  timestamp: Date;
};

export type sourceList = {
  id: string;
  pullFrom?: string;
};

/**
 * do the values in the item corresponding to the associated key in the query string
 * match all of the values in the query value
 * @example
 * const items = [
 *  {categories: ["humans", "monkeys", "cats"]},
 *  {categories: ["cats", 'dogs', "giraffes"], fears:["elephants"]}
 * ]
 * const query = {categories: ["cats","dogs"]}
 * items.filter(predicate(query)) === [items[1]] //true
 */

const predicate = <P extends Grammar, T extends grammarResult<P>>(
  query: T | any,
  strategy = "all"
) => (item: any) => {
  const inList = (list: string[]) => (queryString: string) =>
    list && RegExp(queryString).test(list.join(" "));
  const matchesList = (queries: string[], list: string[]) =>
    queries && (queries.filter(inList(list)).length > 0 ? true : false);
  return _.keys(query)
    .map(key => matchesList(query[key], item[key]))
    .reduce((prev, curr) => prev && curr, true);
};

export const matchesTodo = (query: Without<Todo, "id">) => (item: Todo) => {};

export const getCompletions = (state: AppState) => (info: TabTabEnvParse) => {
  if (!info.complete) return;
  const command = info.line.split(" ")[0];
  const completers = {
    list: ({ partial }: TabTabEnvParse) =>
      Object.keys(state.listMetaData)
        .filter(listName => listName.startsWith(partial))
        .map(str => str.replace(partial, chalk.blue(partial))),
    todo: ({ prev, partial }: TabTabEnvParse) => {
      const pullFromId = state.listMetaData[prev].pullFrom;
      const pullFrom = pullFromId
        ? state.lists[pullFromId]
        : Object.values(state.lists).reduce((prev, curr) => {
            return { ...prev, ...curr };
          }, {});
      return Object.entries(pullFrom)
        .filter(
          ([id, { text }]) => id.startsWith(partial) || text.startsWith(partial)
        )
        .map(
          ([id, { text }]) =>
            id.replace(partial, chalk.blue(partial)) +
            ":" +
            text.replace(partial, chalk(partial))
        );
    }
  };

  const completionsOrdering = { list: "list", todo: "list todo" };
  const commandList = completionsOrdering[command].split(" ");
  const completerKey =
    commandList[info.words] || commandList[commandList.length - 1];
  const log = completers[completerKey](info);
  tabtab.log(log);
  return log;
};

export const Todo = (info: Without<Todo, "id">) => {
  return { ...info, id: uuidv5(info.text, uuidv5.URL) };
};
