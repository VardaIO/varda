process.on('message', (message) => {
    console.log('client receive message: ', message);
  });
  
  // Causes the parent to print: PARENT got message: { foo: 'bar', baz: null }
  let i = 0
  setInterval(() => {
    i++
    process.send({ foo: 'bar', i});
  }, 1000 )