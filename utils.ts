import _ from "lodash";
import { promisify } from "util";
import { readFile, writeFile, rename } from "fs";
import { safeLoad, safeDump } from "js-yaml";
import { tmpdir } from "os";
import { join } from "path";
import { dataDir } from "./config";

type parserValues = { text: string };
type metaData = { timestamp: Date };

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

export type Grammar = { [x: string]: ((text: string) => any) | RegExp };

export const toDataPath = (id: string) => join(dataDir, id, ".yml");

export const persistCollection = (CollectionId: string) =>
  persist(toDataPath(CollectionId));

export const loadCollection = (CollectionId: string) =>
  load(toDataPath(CollectionId));

const load = (filePath: string) => (defaultReturn = {}) => {
  return promisify(readFile)(filePath).then(yml => {
    return safeLoad(yml.toString()) || defaultReturn;
  });
};

const persist = (filepath: string) => (data: {}) => {
  const tmpPath = join(tmpdir(), Date.now().toString());

  return promisify(writeFile)(tmpPath, safeDump(data))
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
