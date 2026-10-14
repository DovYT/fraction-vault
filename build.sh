#!/bin/bash
# בונה את index.html העצמאי מתוך src/
cd "$(dirname "$0")" && node build.mjs
