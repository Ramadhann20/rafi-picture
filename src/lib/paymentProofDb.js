const DATABASE_NAME =
  "rafi-picture-demo";

const DATABASE_VERSION = 1;

const STORE_NAME =
  "payment-proofs";

function openDatabase() {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          DATABASE_NAME,
          DATABASE_VERSION,
        );

      request.onupgradeneeded =
        () => {
          const database =
            request.result;

          if (
            !database.objectStoreNames.contains(
              STORE_NAME,
            )
          ) {
            database.createObjectStore(
              STORE_NAME,
            );
          }
        };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    },
  );
}

export async function savePaymentProof({
  key,
  file,
}) {
  const database =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      store.put(
        {
          file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          savedAt:
            new Date().toISOString(),
        },
        key,
      );

      transaction.oncomplete =
        () => {
          database.close();
          resolve(key);
        };

      transaction.onerror =
        () => {
          database.close();
          reject(transaction.error);
        };
    },
  );
}

export async function getPaymentProof(
  key,
) {
  const database =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const request =
        store.get(key);

      request.onsuccess = () => {
        database.close();

        resolve(
          request.result ?? null,
        );
      };

      request.onerror = () => {
        database.close();
        reject(request.error);
      };
    },
  );
}

export async function getPaymentProofUrl(
  key,
) {
  const record =
    await getPaymentProof(key);

  if (!record?.file) {
    return null;
  }

  return URL.createObjectURL(
    record.file,
  );
}

export async function deletePaymentProof(
  key,
) {
  const database =
    await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readwrite",
        );

      transaction
        .objectStore(STORE_NAME)
        .delete(key);

      transaction.oncomplete =
        () => {
          database.close();
          resolve();
        };

      transaction.onerror =
        () => {
          database.close();
          reject(transaction.error);
        };
    },
  );
}