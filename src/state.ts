import { sourceList, Todo } from "./todo";

export type AppState = {
  listMetaData: { [x: string]: sourceList | undefined };
  lists: { [x: string]: { [x: string]: Todo } | undefined };
};

// all lists
// all list names
// sourcelistof(currentList)
// listInfo
//

// change pullfrom
// create new

// persist
