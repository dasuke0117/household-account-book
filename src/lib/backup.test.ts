import { describe, expect, it } from 'vitest'
import { createBackupJson, parseBackupJson, type BackupData } from './backup'

const sample: BackupData = {
  settings: { monthlyBudget: 150000 },
  expenses: [
    {
      id: 'a1',
      amount: 1200,
      category: '外食費',
      rating: '無駄',
      date: '2026-11-23',
      createdAt: 1795400000000,
    },
  ],
}

describe('バックアップ', () => {
  it('書き出したものをそのまま読み込める', () => {
    const json = createBackupJson(sample, new Date('2026-11-23T00:00:00Z'))
    expect(parseBackupJson(json)).toEqual(sample)
  })

  it('JSONでないファイルはエラーにする', () => {
    expect(() => parseBackupJson('こんにちは')).toThrow('JSONファイルとして読み込めませんでした')
  })

  it('別のアプリのファイルはエラーにする', () => {
    expect(() => parseBackupJson('{"app":"other"}')).toThrow('この家計簿のバックアップファイルではありません')
  })

  it('おかしな支出が入っていたら、何件目かが分かるエラーにする', () => {
    const broken = JSON.parse(createBackupJson(sample))
    broken.expenses.push({ ...sample.expenses[0], id: 'a2', category: '宝くじ' })
    expect(() => parseBackupJson(JSON.stringify(broken))).toThrow('2件目の支出のカテゴリ「宝くじ」は使えません')
  })

  it('ありえない日付はエラーにする', () => {
    const broken = JSON.parse(createBackupJson(sample))
    broken.expenses[0].date = '2026-02-30'
    expect(() => parseBackupJson(JSON.stringify(broken))).toThrow('1件目の支出の日付が正しくありません')
  })

  it('金額が0やマイナス、小数ならエラーにする', () => {
    for (const amount of [0, -100, 12.5]) {
      const broken = JSON.parse(createBackupJson(sample))
      broken.expenses[0].amount = amount
      expect(() => parseBackupJson(JSON.stringify(broken))).toThrow('金額が正しくありません')
    }
  })

  it('新しいバージョンのファイルは読み込まない', () => {
    const newer = JSON.parse(createBackupJson(sample))
    newer.version = 99
    expect(() => parseBackupJson(JSON.stringify(newer))).toThrow('新しいバージョン')
  })
})
