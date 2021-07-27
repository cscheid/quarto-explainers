---
title: Variance
layout: bootstrap_wide
---

# Variance

*Variance* is the simplest mathematical tool we have to measure the
"spread" of a variable of interest in a dataset. The definition tries
to capture how much we a value tends to change as we pick different
elements in the dataset. It's easiest to define in terms of an
[expectation](expectation.html). The variance is defined to be the
*expected squared difference from the expected value*:

$$ \Var[X] = E[(X - E[X])^2] $$

## Properties

Variance is invariant to translation: $ \Var[X + k] =
\Var[X] $

Variance scales quadratically: $ \Var[kX] = k^2 \Var[X] $

## Covariance

Sometimes we're interested not in measuring the spread of a single
variable, but in the way two different variables relate to each
other. If we slightly rewrite variance to be $ \Var[X] =
E[(X - E[X])(X - E[X])] $, then we can see that we're measuring the
expectation of the product of the difference of the expectation to
itself, *with itself*. But it can be useful to measure this product of
the difference from the expectation between two different expressions,
and this is the *covariance*:

$$ \Cov[X, Y] = E[(X - E[X])(Y - E[Y])] $$



