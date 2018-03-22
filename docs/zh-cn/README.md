# Varda

Varda 是一个DAG型的区块链平台

## 安装

```
git clone https://github.com/VardaIO/varda.git
cd varda
npm install
```

## 初始化

```
npm run init
```

## 配置

配置文件在config.json中

如果节点是议会节点，将`commission`项更改为`true`

如果你拥有公网IP记得将`enablePublicIp`项更改为`true`

p2p通信端口默认为4002，可以更改`Port`的值来改变端口
http服务的默认端口为3000，可以更改`HttpPort`的值来改变端口

## 启动

```
node index.js
// or 
npm run start
```

## http api

### GET /genMnemonic
这将返回一个符合BIP39规范的，包含12个单词的密语

例如：

```
curl -X GET \
http://localhost:3000/genMnemonic

```

返回：

```
{
  "mnemonic": "arena sport insane shadow dune winner mercy analyst impulse supreme situate achieve"
}
```

### POST /verifyMnemonic
验证密语是否合法，返回true/false

`key: mnemonic`

示例：

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{ "mnemonic": "arena sport insane shadow dune winner mercy analyst impulse supreme situate achieve" }' \
http://localhost:3000/verifyMnemonic
```

返回：

```
"result": true
```

### POST /mnemonicToSk
将密语转变为私钥

`key: mnemonic`

示例：

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{ "mnemonic": "arena sport insane shadow dune winner mercy analyst impulse supreme situate achieve" }' \
http://localhost:3000/mnemonicToSk
```
返回：

```
{
  "sk": "1446399d6543d970aa8674b62eb3c94a8dee410b21b5fd3ec8ada8a87f6f0c10f2807617de0ad8b35b4974dcf5efe0ebbee0815740f113895d7f96b9bef75762"
}
```

### POST /skToAddress
将私钥转变为地址

`key: sk`

示例：

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{ "sk": "1446399d6543d970aa8674b62eb3c94a8dee410b21b5fd3ec8ada8a87f6f0c10f2807617de0ad8b35b4974dcf5efe0ebbee0815740f113895d7f96b9bef75762" }' \
http://localhost:3000/skToAddress
```

返回： 

```
{
  "address": "V2XM2QWFDDN5KHM2MISLUJPLOUMJQ"
}
```

### POST /getStar
根据starHash获取特定star

`key: starHash`

示例：

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{ "starHash": "zyVnC0HQUrU2CbWt2PZrn0vBL/csjrtygwKU7Lk971s=" }' \
http://localhost:3000/getStar
```

返回：

```
{
  "star": {
    "star_hash": "zyVnC0HQUrU2CbWt2PZrn0vBL/csjrtygwKU7Lk971s=",
    "mci": 1,
    "timestamp": 1521647543,
    "payload_hash": "5a00aca93e1b8fb1ba5a16c8bb1b35ba6a332309563e8c5e28cf8358fcf006a9",
    "authorAddress": "VLRAJEAFXJBVYZQYT67YUQ3KJV53A",
    "signature": "558b56075e401beb777fdeac754c97f40e947005cfc3522b4d71d469433d911b75818476a04d407183968f5f77c518b389ed006e088903ee9e14c1ce1f743005",
    "parentStars": [
      "dYixChMfNFnkpGCyaqQLYjcpq2Cxw5RAhgfqh+jKKYA="
    ],
    "transaction": {
      "type": 1,
      "sender": "VLRAJEAFXJBVYZQYT67YUQ3KJV53A",
      "amount": 10,
      "recpient": "V2XM2QWFDDN5KHM2MISLUJPLOUMJS",
      "senderPublicKey": "f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba",
      "payload_hash": "5a00aca93e1b8fb1ba5a16c8bb1b35ba6a332309563e8c5e28cf8358fcf006a9"
    }
  }
```

### POST /getStars
根据主链序号获取Star

`key: index`

示例：

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{ "index": 0 }' \
http://localhost:3000/getStars
```

返回：

```
{
  "stars": [
    {
      "timestamp": 1518578669,
      "parentStars": [],
      "payload_hash": "ELggd3MSKdJf9HuOK3V7TkfhOeEnqmTUtmdF7yFkK9A=",
      "transaction": {
        "payload_hash": "a1b5b773e6ed9177e34fcdfe761d5b1f54dcd4514dcf24d1df15e79a9cab01a5",
        "type": 0,
        "sender": "system",
        "amount": 100000000000,
        "recpient": "VLRAJEAFXJBVYZQYT67YUQ3KJV53A"
      },
      "star_hash": "dYixChMfNFnkpGCyaqQLYjcpq2Cxw5RAhgfqh+jKKYA=",
      "mci": 0,
      "authorAddress": "system"
    }
  ]
}
```

### POST /getBalance
获取某地址的余额

`key: address`

示例：

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{ "address": "V2XM2QWFDDN5KHM2MISLUJPLOUMJQ" }' \
http://localhost:3000/getBalance
```

返回：

```
{
  "balance": 0
}
```

### POST /payment
向一个地址转账

`key： sk, to, amount`

示例：

```
curl -X POST \
-H "Content-Type: application/json" \
-d '{ "sk": "1446399d6543d970aa8674b62eb3c94a8dee410b21b5fd3ec8ada8a87f6f0c10f2807617de0ad8b35b4974dcf5efe0ebbee0815740f113895d7f96b9bef75762", "to": "V2XM2QWFDDN5KHM2MISLUJPLOUMJS", "amount": 0 }' \
http://localhost:3000/payment

```

如果一切正常， 返回：

```
{
  "message": "send success"
}
```

如果有错误发生，返回：

```
{
  "message": "error message"
}
```

### GET /getLastMci
获取最新的主链序号

例如：

```
curl -X GET \
http://localhost:3000/getLastMci

```

返回：

```
{
  "lastMci": 1
}
```
