import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parser';

const prisma = new PrismaClient();

async function importCsvData(filePath: string) {
  const stockRecords: any[] = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      stockRecords.push({
        ticker: row.Ticker,
        date: new Date(row.Date),
        time: row.Time,
        ltp: Number(row.LTP),
        buyPrice: Number(row.BuyPrice),
        buyQty: Number(row.BuyQty),
        sellPrice: Number(row.SellPrice),
        sellQty: Number(row.SellQty),
        ltq: Number(row.LTQ),
        openInterest: Number(row.OpenInterest),
      });
    })
    .on('end', async () => {
      await prisma.stockData.createMany({ data: stockRecords });
      console.log('Data imported successfully');
      await prisma.$disconnect();
    })
    .on('error', (error) => {
      console.error('Error importing data:', error);
    });
}

importCsvData('./data/RELIANCE.BSE.csv');
