exports.timeout = ms => new Promise((resolve) => { setTimeout(resolve, ms); });

exports.withResolvers = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

exports.pipeline = (thunks, startValue) => {
  let $value = startValue;
  if (thunks == null) return Promise.resolve($value);

  return thunks.reduce((promise, thunk) => {
    return promise.then((value) => {
      if (value !== undefined) $value = value;
      return Promise.resolve(thunk($value));
    });
  }, Promise.resolve(startValue));
};
