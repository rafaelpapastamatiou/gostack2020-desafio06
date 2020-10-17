import csvParse from 'csv-parse';

import fs from 'fs';

import path from 'path';

import { tmpFolder } from '../config/upload';

import CreateTransactionService from './CreateTransactionService';

import Transaction from '../models/Transaction';

interface Request {
  importFilename: string;
}

interface CreateTransaction {
  type: string;
  value: number;
  category: string;
  title: string;
}

async function loadCSV(filePath: string): Promise<any[]> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const lines: any[] = [];

  parseCSV.on('data', line => {
    lines.push(line);
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return lines;
}

class ImportTransactionsService {
  async execute({ importFilename }: Request): Promise<Transaction[]> {
    const createTransaction = new CreateTransactionService();

    const filePath = path.resolve(tmpFolder, importFilename);

    const data = await loadCSV(filePath);

    const createTransactionsPromises = data.map(row =>
      createTransaction.execute({
        title: row[0],
        type: row[1],
        value: row[2],
        category: row[3],
      }),
    );

    const transactions = await Promise.all(createTransactionsPromises);

    return [...transactions];
  }
}

export default ImportTransactionsService;
