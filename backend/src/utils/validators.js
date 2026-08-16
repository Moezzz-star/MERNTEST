import { ObjectId } from "mongodb";

export function validObjectId(id) {
  return ObjectId.isValid(id);
}