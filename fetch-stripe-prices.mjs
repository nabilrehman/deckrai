import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51SU1213ZT6RXP9jPwIY6Vp1PkshtFGLGiZhBI7krJ7cazepFGHPeykBR0n8aARo9AJGwqgzEhITNvU9V3TgCUWnQ00dlFsXRRu', {
  apiVersion: '2024-11-20.acacia',
});

async function fetchPrices() {
  try {
    console.log('🔍 Fetching all products from Stripe...\n');

    // Fetch all products
    const products = await stripe.products.list({
      limit: 100,
    });

    console.log(`Found ${products.data.length} products:\n`);
    for (const product of products.data) {
      console.log(`━ ${product.name} (${product.id})`);
    }

    console.log('\n🔍 Fetching all prices from Stripe...\n');

    // Fetch all prices
    const prices = await stripe.prices.list({
      limit: 100,
      expand: ['data.product'],
    });

    console.log(`Found ${prices.data.length} prices:\n`);

    for (const price of prices.data) {
      const product = price.product;
      const productName = typeof product === 'string' ? product : product.name;
      const productId = typeof product === 'string' ? product : product.id;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Product: ${productName}`);
      console.log(`Product ID: ${productId}`);
      console.log(`Price ID: ${price.id}`);
      console.log(`Amount: $${(price.unit_amount / 100).toFixed(2)}`);
      console.log(`Currency: ${price.currency.toUpperCase()}`);
      console.log(`Type: ${price.type}`);
      console.log(`Recurring: ${price.recurring ? `${price.recurring.interval}ly` : 'N/A'}`);
      console.log(`Active: ${price.active}`);
      console.log('');
    }

    console.log('\n🎯 LOOKING FOR MATCHES:\n');

    // Find Starter Plan ($19/month)
    const starterPrice = prices.data.find(p => {
      const product = p.product;
      const productName = typeof product === 'string' ? '' : (product.name || '').toLowerCase();
      return (
        p.unit_amount === 1900 && // $19
        p.recurring?.interval === 'month' &&
        p.active &&
        (productName.includes('starter') || productName.includes('19'))
      );
    });

    // Find Business Plan ($99/month)
    const businessPrice = prices.data.find(p => {
      const product = p.product;
      const productName = typeof product === 'string' ? '' : (product.name || '').toLowerCase();
      return (
        p.unit_amount === 9900 && // $99
        p.recurring?.interval === 'month' &&
        p.active &&
        (productName.includes('business') || productName.includes('99'))
      );
    });

    if (starterPrice) {
      const product = starterPrice.product;
      const productName = typeof product === 'string' ? product : product.name;
      console.log(`✅ STARTER PLAN FOUND: ${productName}`);
      console.log(`   Price ID: ${starterPrice.id}`);
      console.log(`   Amount: $${(starterPrice.unit_amount / 100).toFixed(2)}/month\n`);
    } else {
      console.log(`❌ STARTER PLAN NOT FOUND ($19/month)\n`);
    }

    if (businessPrice) {
      const product = businessPrice.product;
      const productName = typeof product === 'string' ? product : product.name;
      console.log(`✅ BUSINESS PLAN FOUND: ${productName}`);
      console.log(`   Price ID: ${businessPrice.id}`);
      console.log(`   Amount: $${(businessPrice.unit_amount / 100).toFixed(2)}/month\n`);
    } else {
      console.log(`❌ BUSINESS PLAN NOT FOUND ($99/month)\n`);
    }

    console.log('\n📝 UPDATE YOUR CONFIG WITH:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    if (starterPrice) {
      console.log(`starter: {`);
      console.log(`  stripePriceId: '${starterPrice.id}',`);
      console.log(`}\n`);
    }
    if (businessPrice) {
      console.log(`business: {`);
      console.log(`  stripePriceId: '${businessPrice.id}',`);
      console.log(`}\n`);
    }

    if (!starterPrice || !businessPrice) {
      console.log('\n⚠️  MISSING PRICES - YOU NEED TO CREATE THEM IN STRIPE:');
      console.log('   Go to: https://dashboard.stripe.com/test/products');
      console.log('   Create the missing plans with the correct pricing\n');
    }

  } catch (error) {
    console.error('❌ Error fetching prices:', error.message);
  }
}

fetchPrices();
