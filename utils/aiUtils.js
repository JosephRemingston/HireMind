const ALLOWED_STAGES = new Set([
  "$match", "$group", "$sort", "$limit", "$skip", "$project",
  "$unwind", "$lookup", "$count", "$addFields", "$set"
]);

const BLOCKED_STAGES = new Set([
  "$out", "$merge", "$graphLookup", "$currentOp", "$listSessions"
]);

export function validateMongoPipeline(pipeline) {
  if (!Array.isArray(pipeline)) {
    throw new Error("Pipeline must be an array");
  }
  for (const stage of pipeline) {
    const keys = Object.keys(stage);
    if (keys.length !== 1) {
      throw new Error("Each pipeline stage must contain exactly one operator");
    }

    const operator = keys[0];

    if (BLOCKED_STAGES.has(operator)) {
      throw new Error(`Blocked MongoDB stage used: ${operator}`);
    }

    if (!ALLOWED_STAGES.has(operator)) {
      throw new Error(`Unsupported MongoDB stage: ${operator}`);
    }
  }

  return true;
}

export function validateCollection(collection, schema) {
  if (!schema[collection]) {
    throw new Error(`Collection '${collection}' does not exist in schema`);
  }
}

export async function executeMongoQuery({connection, collection, pipeline, schema}) {

    if(!collection || !pipeline){
        throw new Error("Collection and pipeline are required.");
    }

    if(!connection){
        throw new Error("No database connection available.");
    }

    validateCollection(collection , schema);
    validateMongoPipeline(pipeline);

    var response = await connection.db
        .collection(collection)
        .aggregate(pipeline , {allowDiskUse : false})
        .toArray();

    return response;
}
