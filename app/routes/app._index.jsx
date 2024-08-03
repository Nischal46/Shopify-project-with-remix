import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Button, Card, Page, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState } from "react";


export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  const myHeaders = new Headers();
  myHeaders.append("X-Shopify-Access-Token", session.accessToken);

  const customerApi = await admin.rest.resources.Customer.all({
    session
  })

  const orderApi = await admin.rest.resources.Order.all({
    session: session,
    status: "any",
  });

  const productApi = await admin.rest.resources.Product.all({
    session: session,
  });


  return json({ customerApi, productApi, orderApi })

}

const cssStyle = {
  display: 'flex', flexWrap: 'wrap', justifyContent: 'start', gap: '2em', flexDirection: 'column', textAlign: 'center'
}



export default function Index() {

  const { customerApi, productApi, orderApi } = useLoaderData();

  const groupedProducts = {};

  orderApi.data?.forEach(order => {
    order.line_items.forEach(item => {
      if (groupedProducts[item.name]) {
        groupedProducts[item.name] += item.quantity;
      } else {
        groupedProducts[item.name] = item.quantity;
      }
    });
  });

  const result = [];
  for (let name in groupedProducts) {
    result.push({ name, quantity: groupedProducts[name] });
  }

  const imagesMap = {};
  productApi.data.forEach(product => {
    imagesMap[product.title] = product.image?.src || null;
  });

  const bestSellingProducts = result.map(item => {
    return {
      name: item.name,
      quantity: item.quantity,
      image: imagesMap[item.name.split(' - ')[0]] || null
    };
  });


  console.log(customerApi);


  const bestCustomers = customerApi.data?.map((cl, ind) => {
    return {
      name: cl.first_name + cl.last_name,
      email: cl.email,
      total_spent: cl.total_spent,
      contact: cl.phone
    }
  })


  const [isOpen, setIsOpen] = useState('products')


  return (
    <Page>

      <div style={{ display: 'flex', gap: '2em', marginBottom: '1rem' }}>
        <Button onClick={() => setIsOpen('products')}>Show Products</Button>
        <Button onClick={() => setIsOpen('customers')}>Show Customers</Button>
      </div>

      {isOpen === 'products' ? <>
        <Text variant="headingMd">Best Selling Products</Text>
        <div style={cssStyle}>
          {bestSellingProducts.sort((a, b) => +b.quantity - (+a.quantity)).slice(0, 5).map((product, index) => (
            <Card key={index}>
              <img width={100} src={product.image} />
              <div>Title: {product.name}</div>
              <div>Quantity sold: {product.quantity}</div>
            </Card>
          ))}
        </div>

      </>
        :

        <>
          <div style={{ marginTop: '3rem' }}></div>
          <Text variant="headingMd">Best Customers</Text>
          <div style={cssStyle}>
            {bestCustomers.sort((a, b) => +b.total_spent - (+a.total_spent)).map((customer) => (
              <Card key={customer.id}>
                <div>Customer Name: {customer.name}</div>
                <div>Customer Email: {customer.email}</div>
                <div>Customer Contact: {customer.contact}</div>
                <Text>Amount Spent: <strong>{customer.total_spent}</strong></Text>
              </Card>
            ))}
          </div></>
      }

    </Page>


  );
}








