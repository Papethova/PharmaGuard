import { writeBatch, type Firestore, type DocumentReference } from "firebase/firestore";

export class ChunkedBatch {
  private db: Firestore;
  private batches: any[] = [];
  private currentBatch: any;
  private opCount = 0;
  private maxOpsPerBatch = 400; // Safe threshold under Firestore's 500-operation limit

  constructor(db: Firestore) {
    this.db = db;
    this.currentBatch = writeBatch(db);
  }

  private checkLimit() {
    if (this.opCount >= this.maxOpsPerBatch) {
      this.batches.push(this.currentBatch);
      this.currentBatch = writeBatch(this.db);
      this.opCount = 0;
    }
  }

  set(docRef: DocumentReference, data: any, options?: any) {
    this.checkLimit();
    if (options) {
      this.currentBatch.set(docRef, data, options);
    } else {
      this.currentBatch.set(docRef, data);
    }
    this.opCount++;
  }

  update(docRef: DocumentReference, data: any) {
    this.checkLimit();
    this.currentBatch.update(docRef, data);
    this.opCount++;
  }

  delete(docRef: DocumentReference) {
    this.checkLimit();
    this.currentBatch.delete(docRef);
    this.opCount++;
  }

  async commit() {
    if (this.opCount > 0) {
      this.batches.push(this.currentBatch);
    }
    for (const batch of this.batches) {
      await batch.commit();
    }
  }
}
