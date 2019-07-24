import _ from "lodash";
import { promisify } from "util";
import { readFile, writeFile, rename } from "fs";
import { safeLoad, safeDump, dump } from "js-yaml";
import { tmpdir } from "os";
import { join } from "path";
import { sourceList, todoGrammar, Todo } from "./todo";
import Promise from "bluebird";
type parserValues = { text: string };
type metaData = { timestamp: Date };

export const getSourceId = (
  list: sourceList,
  index: number,
  lists: sourceList[]
) => {
  return list.pullFrom || (index !== 0 && lists[index - 1].id);
};

export type Without<T, K> = Pick<T, Exclude<keyof T, K>>;

export type parser = <T extends Grammar>(
  g: T
) => (
  t: string
) => { [x in (keyof T) & keyof parserValues & keyof metaData]: any };

export type wordInfo = {
  value: string; // - Word containing cursor
  index: number; // - Position of cursor within word
  partialLeft: string; // - Left section of word before cursor (e.g. 'pub' in npm pub|lish)
  partialRight: string;
};

export const parse: parser = (grammar: Grammar) => (text: string) => {
  return _.mapValues(grammar, val => {
    return val instanceof RegExp ? text.match(val) : val(text);
  });
};
export const dataDir = join(__dirname, "../", "data");

export type Grammar = { [x: string]: ((text: string) => any) | RegExp };

export const toDataPath = (id: string) => join(dataDir, id + ".yml");

export const persistState = () => persist(toDataPath("state"));

export const loadState = (defaultState: {}) => {
  return load(toDataPath("state")).catch(() => defaultState);
};
const load = (filePath: string) => {
  return promisify(readFile)(filePath).then(yml => {
    return safeLoad(yml.toString());
  });
};

const persist = (filepath: string) => (data: {}) => {
  const tmpPath = toDataPath(Date.now().toString());
  const yml = safeDump(data);
  console.log({ filepath, data, yml });

  return promisify(writeFile)(tmpPath, yml)
    .then(() => {
      console.log("successfully wrote tmp");
      promisify(rename)(tmpPath, filepath)
        .then(() => {
          console.log("successfully overwrote subscriptions");
        })
        .catch(err => {
          console.error("file rename failed: ", err);
        });
    })
    .catch(err => console.error(err));
};
