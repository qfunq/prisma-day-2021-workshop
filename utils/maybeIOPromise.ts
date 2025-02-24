//import reader from 'readline-sync';
import { u } from './unit';
//import { sideEffect } from './unit';

import { Maps, drop, addPropValue, hardCast } from './func';

import { log, safeStackRenderer } from './logging';

import { bad, isBad, mapBad, with_default } from './badValues';

export type IOthunk<T> = () => Promise<T>;

// A combination of IO/Maybe/Promises, all linked together in a way that largely works as expected.
// If used non-recursively, it forces the CCC, quite rigorously. Trying to run the code unbound
// to the other scripts is an amusingly visual lesson in async code.
// String IO needs additonal forwarding parms to allow persistance of environment.

//https://www.youtube.com/watch?v=vkcxgagQ4bM 21:15 ... you might be asking, what is this U?

// The next line is a problem, because it uses the heap. The compiler needs to do a lot more work
// to build monadic code efficiently, largely eliminating this new, according to the context.
// Since we are explicitly calling new, this will be tricky.
// The compiler will take this new instruction literally. This is the main point of Bartosz's
// lecture, its a howto and a warning: take this code seriously, it presents problems for compilers.
// C++ has big issues with it, and typescript suffers too.
// There are workarounds, based on coroutines, which can allocate memory more efficiently.
// It's not clear these will code that cleanly in typescipt, but the basic monadic code is simpler
// in typescript, bar it requires async handling.

export const makeIO = <T>(f: IOthunk<T>): IO<T> => new IO<T>(f);

export const embed = <T>(val: T) => Promise.resolve(val);

export const filterClos =
  <T>(f: Maps<NonNullable<T>, boolean>) =>
  (val: NonNullable<T>) => {
    const r = f(val);
    return r ? val : bad<T>();
  };

export class IO<T> {
  private act: IOthunk<T>;

  constructor(action: IOthunk<T>) {
    this.act = action;
  }

  //Embed values and functions
  static root = <T>(val: T) => makeIO<T>(() => embed(val));
  static rootfun = <T>(thunk: () => T) => makeIO<T>(() => embed(thunk()));

  readonly run = () => this.act();

  readonly fbind = <M>(io: Maps<T, IO<M>>) =>
    makeIO(
      () => this.run().then(x => io(mapBad(x)).run())
      //.catch(x => this.warn("fbind error")(err => io(bad<T>()).run()))
    );

  readonly then = <R>(f: Maps<NonNullable<T>, R>) =>
    makeIO(() =>
      this.run().then(x =>
        isBad(x) ? embed(bad<R>()) : embed(mapBad(f(<NonNullable<T>>x)))
      )
    );
  //.catch(this.warn("fbind error")(x => bad<R>()));

  readonly filter = (f: Maps<NonNullable<T>, boolean>) =>
    this.then((v: NonNullable<T>) => <T>filterClos(f)(v));

  readonly cast = <W extends T>() => this.then(x => <W>(<T>x));

  readonly hardCast = <W>() => this.then(x => hardCast(x)<W>());

  readonly flet = <NewType>(dataExtender: Maps<T, NewType>) =>
    this.then(old => addPropValue(old)(dataExtender));

  readonly side = <A>(f: Maps<NonNullable<T>, A>) =>
    this.then(x => {
      f(x);
      return <T>x;
    });

  readonly successMsg = (msg: string) =>
    this.side(e => drop(e)(log().success(msg)));

  //.then for promise returning functions.
  readonly promise = <R>(f: Maps<NonNullable<T>, Promise<R>>) =>
    makeIO(() =>
      this.run().then(x =>
        isBad(x) ? bad<Promise<R>>() : mapBad(f(<NonNullable<T>>x))
      )
    );

  //Monitor the current state of the environment
  readonly env = () =>
    this.then(x => {
      log().info(x);
      return <T>x;
    });

  readonly fmap = this.then;

  readonly exec = async (def: NonNullable<T>) => {
    const prom = embed(def as T);
    return this.run()
      .then(x => embed(with_default(def)(x)))
      .catch(x => {
        safeStackRenderer(x);
        return prom;
      });
  };
}

export const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
const dropEnvir = drop;

export const putStr =
  <T>(env: T) =>
  (s: string) =>
    new Promise<T>(resolved => {
      process.stdout.write(s, z => dropEnvir(z)(resolved(env)));
      return env;
    });

//This is a good model, its a raw socket write,
//So we need to attach a callback to it
export const putStrM = (s: string) => makeIO(() => putStr(s)(s));

//export const getLine = () => reader.question('');
export const pure = <T>(x: T) => IO.root(x);
// disable the error, but lint has a point, the environment is lost
// synchronous, because async keyboard IO is a pain.

//export const getStrM = (x: U) => pure(x).then(z => dropEnvir(z)(getLine()));

export const prompt =
  <V>(str: string) =>
  (x: V) => {
    putStrM(str);
    return x;
  };

export const ioRoot = pure(u);
