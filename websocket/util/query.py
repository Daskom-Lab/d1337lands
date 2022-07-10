import requests
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from dotenv import dotenv_values
from inspect import getsourcefile
from os.path import abspath

config = dotenv_values(f"{abspath(getsourcefile(lambda:0))}/../../.env")

graphql_endpoint_url = "http://graphql-engine:8080/v1/graphql"
webservice_endpoint_url = "http://webservice:3000/api"
hasura_admin_secret = config["GQL_SECRET"]


def call_http_request(url, token, data={}, method="GET"):
    if method == "GET":
        return requests.get(
            f"{webservice_endpoint_url}{url}",
            headers={"Authorization": f"Bearer {token}"},
            data=data,
        )
    elif method == "POST":
        return requests.post(
            f"{webservice_endpoint_url}{url}",
            headers={"Authorization": f"Bearer {token}"},
            data=data,
        )

    return None


def call_gql_request(query, variable_data, token=hasura_admin_secret):
    if token == hasura_admin_secret:
        transport = RequestsHTTPTransport(
            url=graphql_endpoint_url,
            verify=True,
            retries=3,
            headers={
                "content-type": "application/json",
                "x-hasura-admin-secret": hasura_admin_secret,
            },
        )
    else:
        transport = RequestsHTTPTransport(
            url=graphql_endpoint_url,
            verify=True,
            retries=3,
            headers={
                "content-type": "application/json",
                "Authorization": "Bearer {}".format(token),
            },
        )

    client = Client(transport=transport, fetch_schema_from_transport=True)

    return client.execute(gql(query), variable_values=variable_data)
