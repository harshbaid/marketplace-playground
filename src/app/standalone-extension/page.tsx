"use client";

import { useState, useEffect } from "react";
import type { ApplicationContext } from "@sitecore-marketplace-sdk/client";
import { useMarketplaceClient } from "@/src/utils/hooks/useMarketplaceClient";
import { WhoAmI } from "./components/WhoAmI";
import { DictionaryItem, fetchDictionaryItems } from "@/src/lib/sitecore-dictionary";

function StandaloneExtension() {
  const { client, error, isInitialized } = useMarketplaceClient();
  const [appContext, setAppContext] = useState<ApplicationContext>();

  const [appDictionaryItems, setAppDictionaryItems] = useState<DictionaryItem[]>();

  useEffect(() => {
    if (!error && isInitialized && client) {
      client.query("application.context")
        .then((res) => {
          console.log("Success retrieving application.context:", res.data);
          setAppContext(res.data);
        })
        .catch((error) => {
          console.error("Error retrieving application.context:", error);
        });
    } else if (error) {
      console.error("Error initializing Marketplace client:", error);
    }
  }, [client, error, isInitialized]);

  // Fetch dictionary items from Sitecore
  useEffect(() => {
    const fetchSitecoreDictionary = async () => {
      if (!client || !isInitialized) {
        return;
      }

      try {
        const dictionaryPath = "/sitecore/content/ai/cadenceaiconversion/Dictionary/Demo";
        const dictionaryItems = await fetchDictionaryItems(
          client,
          dictionaryPath,
          "en",
        );

        if (dictionaryItems && dictionaryItems.length > 0) {
          console.log(
            "Successfully fetched dictionary items:",
            dictionaryItems,
          );
          setAppDictionaryItems(dictionaryItems);
          console.log("First dictionary item:", dictionaryItems[0]);
        } else {
          console.log("No dictionary items found");
          setAppDictionaryItems([]);
        }
      } catch (err) {
        console.error("Error fetching dictionary items:", err);
      }
    };

    fetchSitecoreDictionary();
  }, [client, isInitialized]);

  return (
    <>
      {isInitialized && (
        <>
          {appContext && (
            <>
              <h1>Welcome to {appContext?.name}</h1>
              <p>This is a standalone extension.</p>
              <div className="application-context">
                <h3>Application Context:</h3>
                <ul className="context-details">
                  <li><strong>Name:</strong> {appContext.name}</li>
                  <li><strong>ID:</strong> {appContext?.id}</li>
                  <li><strong>Icon URL:</strong> {appContext?.iconUrl}</li>
                  <li><strong>Installation ID:</strong> {appContext?.installationId}</li>
                  <li><strong>State:</strong> {appContext?.state}</li>
                  <li><strong>Type:</strong> {appContext?.type}</li>
                  <li><strong>URL:</strong> {appContext?.url}</li>
                </ul>
              </div>
              <div style={{ margin: '20px 0' }}>
                <WhoAmI />
              </div>
              <div>
                <h3>Dictionary Items:</h3>
                <ul>
                  {appDictionaryItems?.map((item) => (
                    <li key={item.key}>{item.phrase}</li>
                  ))}
                </ul>
                {appDictionaryItems?.length === 0 && (
                  <p>No dictionary items found</p>
                )}
                {appDictionaryItems?.length === undefined && (
                  <p>Loading dictionary items...</p>
                )}
              </div>
            </>
          )}
        </>
      )}
      {error && <p style={{ color: "red" }}>Error: {String(error)}</p>}
    </>
  );
}

export default StandaloneExtension;
