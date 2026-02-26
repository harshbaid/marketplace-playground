import { ClientSDK } from "@sitecore-marketplace-sdk/client";

/**
 * Helper to safely extract error message from unknown error types
 * @param error - Error of unknown type
 * @returns Error message string
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/**
 * Dictionary entry template ID
 * This is the standard Sitecore dictionary entry template
 */
const DICTIONARY_ENTRY_TEMPLATE_ID = "{6D1CD897-1936-4A3A-A511-289A94C2A7B1}";

/**
 * Represents a dictionary item from Sitecore
 */
export interface DictionaryItem {
    key: string;
    phrase: string;
}

/**
 * GraphQL response structure from xmc.preview.graphql endpoint
 * @internal
 */
interface GraphQLResponse {
    data: {
        data: {
            item: {
                children: {
                    results: Array<{
                        keyField?: {
                            value: string;
                        };
                        phraseField?: {
                            value: string;
                        };
                    }>;
                };
            };
        };
    };
}

/**
 * Get the application context from Sitecore
 * @param client - Sitecore Marketplace SDK client
 * @returns Application context data or null if failed
 */
export async function getApplicationContext(
    client: ClientSDK | null,
): Promise<unknown | null> {
    if (!client) {
        return null;
    }

    try {
        const application = await client.query("application.context");
        return application?.data ?? null;
    } catch (error: unknown) {
        console.error("Failed to get application context:", getErrorMessage(error));
        return null;
    }
}

/**
 * Get the preview context ID for GraphQL queries
 * @param client - Sitecore Marketplace SDK client
 * @returns Preview context ID or null if failed
 */
export async function getPreviewContextId(
    client: ClientSDK | null,
): Promise<string | null> {
    if (!client) {
        return null;
    }

    try {
        const appContext = await getApplicationContext(client);

        if (!appContext) {
            return null;
        }

        // Type-safe access to nested properties
        const previewContextId = (appContext as any)?.resources?.[0]?.context
            ?.preview;

        if (typeof previewContextId !== "string") {
            console.error("Preview context ID not found in application context");
            return null;
        }

        return previewContextId;
    } catch (error: unknown) {
        console.error("Failed to get preview context ID:", getErrorMessage(error));
        return null;
    }
}

/**
 * Validates that a string is a safe Sitecore path
 * @param path - Path to validate
 * @returns True if path appears to be a valid Sitecore path
 */
function isValidSitecorePath(path: string): boolean {
    // Basic validation: should start with /sitecore/ and contain only safe characters
    return /^\/sitecore\/[\w\s\-/]+$/.test(path);
}

/**
 * Validates that a string is a safe language code
 * @param language - Language code to validate
 * @returns True if language code is valid
 */
function isValidLanguageCode(language: string): boolean {
    // Language codes should be 2-5 lowercase letters, optionally with hyphen
    return /^[a-z]{2}(-[a-z]{2,3})?$/i.test(language);
}

/**
 * Fetch dictionary items from Sitecore content tree
 * @param client - Sitecore Marketplace SDK client
 * @param dictionaryPath - Path to the dictionary folder in Sitecore
 * @param language - Language code (default: "en")
 * @returns Array of dictionary items
 * @throws {Error} If path or language parameters are invalid
 */
export async function fetchDictionaryItems(
    client: ClientSDK | null,
    dictionaryPath: string = "/sitecore/content/ai/cadenceaiconversion/Dictionary/Demo",
    language: string = "en",
): Promise<DictionaryItem[]> {
    if (!client) {
        console.error("Sitecore client is not initialized");
        return [];
    }

    // Validate inputs to prevent GraphQL injection
    if (!isValidSitecorePath(dictionaryPath)) {
        console.error("Invalid dictionary path format:", dictionaryPath);
        return [];
    }

    if (!isValidLanguageCode(language)) {
        console.error("Invalid language code format:", language);
        return [];
    }

    try {
        const previewContextId = await getPreviewContextId(client);
        console.log("Preview Context ID:", previewContextId);

        if (!previewContextId) {
            console.warn("No preview context ID found");
            return [];
        }

        const query = `{
              item(path:"${dictionaryPath}", language:"${language}") {
                children(includeTemplateIDs:"${DICTIONARY_ENTRY_TEMPLATE_ID}") {
                  results {
                    keyField: field(name: "Key") {
                      value
                    },
                    phraseField: field(name: "Phrase") {
                      value
                    }
                  }
                }
              }
            }`;

        console.log("Executing GraphQL Query:", query);

        // Execute GraphQL query
        // Note: We use type assertion here because the SDK's generic types don't match
        // the specific structure returned by the xmc.preview.graphql endpoint
        const response = (await client.mutate("xmc.preview.graphql", {
            params: {
                query: {
                    sitecoreContextId: previewContextId,
                },
                body: {
                    query: query,
                },
            },
        })) as unknown as GraphQLResponse;

        console.log("GraphQL Response:", JSON.stringify(response, null, 2));

        // Type guard to validate response structure
        const results = response?.data?.data?.item?.children?.results;

        if (!results || !Array.isArray(results)) {
            console.warn("No dictionary items found at path:", dictionaryPath, "Results:", results);
            return [];
        }

        if (results.length === 0) {
            console.warn("Dictionary folder is empty at path:", dictionaryPath);
            return [];
        }

        return results
            .map((item) => {
                const key = item.keyField?.value || "";
                const phrase = item.phraseField?.value || "";

                // Log warning if required fields are missing
                if (!phrase) {
                    console.warn(
                        "Dictionary item missing Phrase field, skipping item with key:",
                        key,
                    );
                }

                return {
                    key,
                    phrase,
                };
            })
            .filter((item) => item.phrase.trim().length > 0);
    } catch (error: unknown) {
        console.error("Failed to fetch dictionary items:", getErrorMessage(error));
        return [];
    }
}