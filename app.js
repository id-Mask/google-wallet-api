const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const { GoogleAuth } = require('google-auth-library')

// config
const issuerId = '3388000000022297494'
const classId = `${issuerId}.codelab_class_v10`
const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1'
const credentials = require('./.id-mask-409508-ce5aefc18985.json')

const httpClient = new GoogleAuth({
  credentials: credentials,
  scopes: 'https://www.googleapis.com/auth/wallet_object.issuer'
})

async function createPassClass(req, res) {
  let genericClass = {
    'id': `${classId}`,
  }
  
  let response
  try {
    // Check if the class exists already
    response = await httpClient.request({
      url: `${baseUrl}/genericClass/${classId}`,
      method: 'GET'
    })
  
    console.log('Class already exists')
    console.log(response)
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Class does not exist
      // Create it now
      response = await httpClient.request({
        url: `${baseUrl}/genericClass`,
        method: 'POST',
        data: genericClass
      })
  
      console.log('Class insert response')
      console.log(response)
    } else {
      // Something else went wrong
      console.log(err)
      res.send('Something went wrong...check the console logs!')
    }
  }
}

async function createPassObject(req, res) {
  let objectSuffix = `${req.body.email.replace(/[^\w.-]/g, '_')}`
  let objectId = `${classId}.${objectSuffix}`
  
  let qrcodeData = {
    key: 'example key: kjhasd78a6s7d856asdjkhasd',
    url: 'https://ipfs.io/ipfs/QmbJSgwfjcE4vqPacGj4Y1eHEXRm5hKBs3qai41fm6DCVc',
    proof: 'proofOfAge',
  }
  
  let genericObject = {
    'id': `${objectId}`,
    'classId': classId,
    'genericType': 'GENERIC_TYPE_UNSPECIFIED',
    'hexBackgroundColor': '#5F5FEA',
    'logo': {
      'sourceUri': {
        'uri': 'https://avatars.githubusercontent.com/u/144892177?s=200&v=4'
      }
    },
    'cardTitle': {
      'defaultValue': {
        'language': 'en',
        'value': 'Id-mask'
      }
    },
    'subheader': {
      'defaultValue': {
        'language': 'en',
        'value': 'Providing identity data'
      }
    },
    'header': {
      'defaultValue': {
        'language': 'en',
        'value': 'Proof of Age'
      }
    },
    'barcode': {
      'type': 'QR_CODE',
      'value': `${JSON.stringify(qrcodeData)}`
    },
  }
  
  // Create the signed JWT and link
  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    origins: [],
    typ: 'savetowallet',
    payload: {
      genericObjects: [
        genericObject
      ]
    }
  }
  
  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' })
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`
  
  res.send(`<a href='${saveUrl}'><img src='wallet-button.png'></a>`)
}

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))
app.post('/', async (req, res) => {
  await createPassClass(req, res)
  await createPassObject(req, res)
})
app.listen(3000)