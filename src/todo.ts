import { Grammar, wordInfo, Without } from "./utils";
import { Chrono } from "chrono-node";
import { parse } from "./utils";
import _ from "lodash";
import uuidv5 from "uuid/v5";
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
  grammar?: Grammar;
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

const getCompletions = <T>(collection: any[], parser: (x: string) => T) => (
  info: { line: string; words: string[]; word: wordInfo },
  cb: (error: any, success: any) => void
) => {
  const query = parser(info.word.partialLeft);
  const matches = collection.filter(predicate(query));
  console.log(matches);
};

export const Todo = (info: Without<Todo, "id">) => {
  return { ...info, id: uuidv5(info.text, uuidv5.URL) };
};
