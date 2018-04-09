module.exports = new Proxy(
  {},
  {
    set: (target, key, value, receiver) => {}
  }
)
