
var assert = require('assert')
var Spender = require('spender')
var CoinKey = require('coinkey')
var coininfo = require('coininfo')

var coinprops = [
  'privateWif',
  'publicAddress',
  'privateKey',
  'publicKey',
  'publicHash',
  'pubKeyHash',
  'publicPoint',
  'compressed'
]

module.exports = {
  forKey: walletForKey,
  createRandom: createRandom
}

/**
 * primitive one key common blockchain wallet
 * @param  {CoinKey|privateWif} coinkey
 * @param  {CommonBlockchain impl} common-blockchain api
 * @return {Object} wallet
 */
function walletForKey (coinkey, blockchain) {
  if (typeof coinkey === 'string') coinkey = CoinKey.fromWif(coinkey)

  assert(coinkey && blockchain, 'Both coinkey and blockchain are required')

  var wallet = {
    coinkey: coinkey,

    send: function (amount) {
      return new Spender()
        .from(coinkey.privateWif)
        .satoshis(amount)
    },

    dumpTo: function (to, cb) {
      wallet.summary(function(err, summary) {
        if (err) return cb(err)

        wallet.send(summary.balance)
          .to(to)
          .spend(cb)
      })
    },

    balance: function (cb) {
      wallet.summary(function (err, summary) {
        cb(err, summary && summary.balance)
      })
    },

    summary: function (cb) {
      blockchain.addresses.summary([coinkey.publicAddress], function (err, arr) {
        if (err) return cb(err)
        if (!arr.length) return cb(new Error('address not found'))

        cb(null, arr[0])
      })
    }
  }

  coinprops.forEach(function(p) {
    wallet[p] = coinkey[p]
  })

  return wallet
}

function createRandom (blockchain) {
  var network = blockchain.network
  if (network === 'testnet') network = 'bitcoin-test'

  var info = coininfo(network)
  if (!info) throw new Error('unknown network')

  return walletForKey(CoinKey.createRandom(info), blockchain)
}
