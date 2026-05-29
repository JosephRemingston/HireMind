import ApiError from "./ApiError.js";

function validateMongoUri(mongoUri) {
  if (!mongoUri || typeof mongoUri !== "string") {
    throw ApiError.badRequest("Mongo URI is required");
  }

  var trimmedMongoUri = mongoUri.trim();

  if (
    !trimmedMongoUri.startsWith("mongodb://") &&
    !trimmedMongoUri.startsWith("mongodb+srv://")
  ) {
    throw ApiError.badRequest(
      "Mongo URI must start with mongodb:// or mongodb+srv://"
    );
  }

  if (trimmedMongoUri.includes("cluster.mongodb.net")) {
    throw ApiError.badRequest(
      "Mongo URI is using the placeholder cluster.mongodb.net host. Replace it with your actual Atlas cluster hostname."
    );
  }

  try {
    new URL(trimmedMongoUri);
  } catch {
    throw ApiError.badRequest("Mongo URI format is invalid");
  }

  return trimmedMongoUri;
}

function mapMongoConnectionError(error) {
  if (error?.message?.includes("querySrv ENOTFOUND _mongodb._tcp.")) {
    return ApiError.badRequest(
      "MongoDB SRV host could not be resolved. Check that the Atlas hostname in your Mongo URI is correct and not still the placeholder cluster.mongodb.net."
    );
  }

  return error;
}

export { mapMongoConnectionError, validateMongoUri };
