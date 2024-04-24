'use client'
import React, { useEffect, useMemo } from 'react'
import { bech32 } from 'bech32'
import { Bech32Address } from '@keplr-wallet/cosmos'
import { PubKeySecp256k1 } from '@keplr-wallet/crypto'

const fromPlaceholder = (fromCategory: string) => {
  switch (fromCategory) {
    case 'bech32':
      return 'cosmos1gyv9dkmrc6fqvd6g9c06hf0ea3ecynwjxy6yq0'
    case 'hex_pubkey':
      return '1234567890abcdef1234567890abcdef12345678'
    case 'hex_address':
      return 'd1BBCB0Bf7fcaa2a90EEfE2AE93cB3554349b8c3'
    default:
      return ''
  }
}

const toPlaceholder = (toCategory: string) => {
  switch (toCategory) {
    case 'bech32':
      return 'cosmosvaloper1gyv9dkmrc6fqvd6g9c06hf0ea3ecynwjrsw3vu'
    case 'ethermint_bech32':
      return 'evmos16xaukzlhlj4z4y8wlc4wj09n24p5nwxrczqahs'
    case 'cosmos_hex_address':
    case 'eth_hex_address':
      return 'd1BBCB0Bf7fcaa2a90EEfE2AE93cB3554349b8c3'
    case 'hex_address':
      return 'd1BBCB0Bf7fcaa2a90EEfE2AE93cB3554349b8c3'
    default:
      return ''
  }
}

const convertUint8ArrayToHexString = (uint8Array: Uint8Array) => {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const convertHexStringToUint8Array = (hexString: string) => {
  // Ensure the hex string length is even
  if (hexString.length % 2 !== 0) {
    console.error('Hex string has an odd number of characters')
    return new Uint8Array(0)
  }
  // Create a buffer to hold the bytes
  const bytes = new Uint8Array(hexString.length / 2)
  // Loop through the hex string, converting each pair of characters into a byte
  for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
    bytes[j] = parseInt(hexString.substring(i, i + 2), 16)
  }
  return bytes
}

const convertWordsToBytes = (words: number[]): number[] => {
  let bytes = [] // 8비트 데이터를 저장할 배열
  let buffer = 0 // 현재 처리중인 비트를 저장할 버퍼
  let bitsInBuffer = 0 // 버퍼에 저장된 비트 수

  words.forEach((value) => {
    // 버퍼에 5비트 값을 추가하고, 버퍼 내 비트 수를 증가
    buffer = (buffer << 5) | value
    bitsInBuffer += 5

    // 버퍼에 8비트 이상 존재하면, 상위 8비트를 새로운 바이트로 추출
    while (bitsInBuffer >= 8) {
      bitsInBuffer -= 8
      bytes.push((buffer >> bitsInBuffer) & 0xff)
    }
  })
  return bytes
}

const convertBytesToWords = (bytes: number[]): number[] => {
  let words = []
  let buffer = 0
  let bitsInBuffer = 0

  bytes.forEach((value) => {
    buffer = (buffer << 8) | value
    bitsInBuffer += 8

    while (bitsInBuffer >= 5) {
      bitsInBuffer -= 5
      words.push((buffer >> bitsInBuffer) & 0x1f)
    }
  })
  return words
}

const importFromKeplr = async (
  chainId: string,
  fromCategory: string,
): Promise<string> => {
  if (!window.keplr) {
    alert('Please install keplr extension')
    return ''
  }
  if (fromCategory === 'bech32') {
    return await window.keplr.getKey(chainId).then((key) => key.bech32Address)
  }
  if (fromCategory === 'hex_pubkey') {
    return await window.keplr
      .getKey(chainId)
      .then((key) => convertUint8ArrayToHexString(key.pubKey))
  }
  if (fromCategory === 'hex_address') {
    return await window.keplr
      .getKey(chainId)
      .then((key) => convertUint8ArrayToHexString(key.address))
  }
  return ''
}

export default function Homepage() {
  const [from, setFrom] = React.useState<string>('')
  const [to, setTo] = React.useState<string>('')
  const [toPrefix, setToPrefix] = React.useState<string>('')
  const [clickToggle, setClickToggle] = React.useState<boolean>(false)
  const [fromCategory, setFromCategory] = React.useState<string>('bech32')
  const [toCategory, setToCategory] = React.useState<string>('bech32')
  const [chainId, setChainId] = React.useState<string>('')

  const fromPrefix = useMemo(() => {
    return fromCategory === 'bech32' ? from.split('1')[0] : ''
  }, [fromCategory, from])

  const handleClickImportFromKeplr = async () => {
    try {
      const from = await importFromKeplr(chainId, fromCategory)
      setFrom(from)
    } catch (e) {
      alert(`Failed to import from Keplr: ${e.message}`)
      setFrom('')
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(to)
    alert('Copied!')
  }

  const convert = async (
    from: string,
    fromCategory: string,
    toCategory: string,
    toPrefix: string,
  ): Promise<string> => {
    switch (fromCategory) {
      case 'bech32':
        switch (toCategory) {
          case 'bech32':
            return bech32.encode(toPrefix, bech32.decode(from).words)
          case 'hex_address':
            const words = bech32.decode(from).words
            const bytes = convertWordsToBytes(words)
            return convertUint8ArrayToHexString(new Uint8Array(bytes))
          default:
            return ''
        }
      case 'hex_pubkey':
        const pubkey = new PubKeySecp256k1(convertHexStringToUint8Array(from))
        switch (toCategory) {
          case 'bech32':
            return new Bech32Address(pubkey.getCosmosAddress()).toBech32(
              toPrefix,
            )
          case 'ethermint_bech32':
            return new Bech32Address(pubkey.getEthAddress()).toBech32(toPrefix)
          case 'cosmos_hex_address':
            return convertUint8ArrayToHexString(
              new Bech32Address(pubkey.getCosmosAddress()).address,
            )
          case 'eth_hex_address':
            return convertUint8ArrayToHexString(
              new Bech32Address(pubkey.getEthAddress()).address,
            )
          default:
            return ''
        }
      case 'hex_address':
        const words = convertBytesToWords(
          Array.from(convertHexStringToUint8Array(from)),
        )
        switch (toCategory) {
          case 'bech32':
            return bech32.encode(toPrefix, words)
          default:
            return ''
        }
      default:
        return ''
    }
  }

  useEffect(() => {
    if (from === '' && toPrefix === '') return
    const setConvertedAddress = async (
      from: string,
      fromCategory: string,
      toCategory: string,
      toPrefix: string,
    ) => {
      try {
        const toAddress = await convert(
          from,
          fromCategory,
          toCategory,
          toPrefix,
        )
        setTo(toAddress)
      } catch (e) {
        alert(`Failed to convert. Please check the input: ${e.message}`)
      }
    }
    setConvertedAddress(from, fromCategory, toCategory, toPrefix)
  }, [clickToggle])

  useEffect(() => {
    setToCategory('bech32')
  }, [fromCategory])

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-row h-full">
        <section className="flex flex-col w-1/2 h-full">
          <div className="flex flex-row p-2 text-md font-semibold text-center border">
            <div className="border rounded">
              <select
                name="from_category"
                id="from-category"
                value={fromCategory}
                onChange={(e) => setFromCategory(e.target.value)}
              >
                <option value="bech32">Bech32</option>
                <option value="hex_pubkey">Hex Pubkey</option>
                <option value="hex_address">Hex Address</option>
              </select>
            </div>
            <div className="ml-auto">
              FROM_PREFIX:{' '}
              <input
                className="w-1/2 text-md text-center font-medium"
                type="text"
                placeholder="cosmos"
                value={fromPrefix}
                disabled={true}
              />
            </div>
          </div>
          <div className="flex flex-col h-full p-2 border gap-2">
            <div className="flex flex-row gap-4 ml-auto">
              <input
                id="input-chain-id"
                className="text-sm border-2 px-2 min-w-1/2"
                type="text"
                placeholder="chain_id(ex. osmosis-1)"
                onChange={(e) => setChainId(e.target.value)}
                value={chainId}
              />
              <button
                id="btn-import-from-keplr"
                className="text-sm p-2 rounded-md bg-slate-200"
                onClick={handleClickImportFromKeplr}
              >
                Import from Keplr
              </button>
            </div>
            <textarea
              className="w-full h-full outline-none text-md"
              placeholder={fromPlaceholder(fromCategory)}
              onChange={(e) => setFrom(e.target.value)}
              value={from}
            />
          </div>
        </section>
        <section className="flex flex-col px-4 text-center h-full">
          <div className="p-2 text-2xl text-center text-transparent">----</div>
          <div className="m-auto items-center">
            <div></div>
            <img src="/arrow.svg" alt="->" className="w-full" />
            <div className="p-2 bg-blue-100 rounded">
              <button onClick={() => setClickToggle(!clickToggle)}>
                convert
              </button>
            </div>
          </div>
        </section>
        <section className="flex flex-col w-1/2 h-full">
          <div className="flex flex-row p-2 text-md font-semibold text-center border">
            <div className="border rounded">
              <select
                name="to_category"
                id="to-category"
                value={toCategory}
                onChange={(e) => setToCategory(e.target.value)}
              >
                {fromCategory === 'bech32' && (
                  <>
                    <option value="bech32">Bech32</option>
                    <option value="hex_address">Hex_Address</option>
                  </>
                )}
                {fromCategory === 'hex_pubkey' && (
                  <>
                    <option value="bech32">Bech32</option>
                    <option value="ethermint_bech32">Ethermint Bech32</option>
                    <option value="cosmos_hex_address">
                      Cosmos Hex Address
                    </option>
                    <option value="eth_hex_address">Eth Hex Address</option>
                  </>
                )}
                {fromCategory === 'hex_address' && (
                  <>
                    <option value="bech32">Bech32</option>
                  </>
                )}
              </select>
            </div>
            <div className="ml-auto">
              TO_PREFIX:{' '}
              <input
                className="w-1/2 text-md text-center font-medium border hover:border-blue-400"
                type="text"
                placeholder="cosmosvaloper"
                onChange={(e) => setToPrefix(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col h-full p-2 border gap-2">
            <div className="flex flex-row gap-4 ml-auto">
              <button
                className="text-sm p-2 rounded-md bg-slate-200"
                onClick={handleCopyToClipboard}
              >
                Copy to Clipboard
              </button>
            </div>
            <textarea
              className="w-full h-full outline-none text-md"
              placeholder={toPlaceholder(toCategory)}
              value={to}
              disabled={true}
            />
          </div>
        </section>
      </div>
      <footer>
        <div className="p-1 text-center border-2">
          Made by{' '}
          <a
            className="text-blue-200 hover:text-purple-400"
            href="https://github.com/chemonoworld/extended-bech32-converter"
          >
            chemonoworld
          </a>
        </div>
      </footer>
    </div>
  )
}
