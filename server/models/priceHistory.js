const admin = require("firebase-admin");

function initPriceHistory(db) {
  return {
    async create(data) {
      const { symbol, price, date } = data;
      const docRef = db.collection("priceHistory").doc();
      await docRef.set({
        symbol,
        price,
        date: date || new Date(),
      });
      return data;
    },

    async find(filter) {
      const { symbol } = filter;
      const snapshot = await db
        .collection("priceHistory")
        .where("symbol", "==", symbol)
        .orderBy("date", "desc")
        .limit(30)
        .get();

      return snapshot.docs.map((doc) => doc.data());
    },
  };
}

module.exports = initPriceHistory;
