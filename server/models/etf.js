const admin = require("firebase-admin");

function initETF(db) {
  return {
    async findOne(symbol) {
      const doc = await db.collection("etfs").doc(symbol).get();
      return doc.data();
    },

    async findOneAndUpdate(filter, update, options) {
      const { symbol } = filter;
      await db.collection("etfs").doc(symbol).set(update.$set, { merge: true });
      return { symbol, ...update.$set };
    },
  };
}

module.exports = initETF;
