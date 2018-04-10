module.exports = new Proxy(
  {},
  {
    // set: (receiver, key, value) => {
    //   console.log( key, value, receiver)
    //   // receiver[key] = value

    // }
    set: function(target, key, value, receiver) {
      console.log(`setting ${key}!`)
      return Reflect.set(target, key, value, receiver)
    }
  }
)
