/*** APP ***/
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";

import { link } from "./link.js";
import { Subscriptions } from "./subscriptions.jsx";
import { Layout } from "./layout.jsx";
import "./index.css";

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name
    }
  }
`;

const EDIT_PERSON = gql`
  mutation EditPerson($id: String, $name: String) {
    editPerson(id: $id, name: $name) {
      id
      name
    }
  }
`;

function App() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const { loading, data } = useQuery(ALL_PEOPLE, {
    // Default:
    // fetchPolicy: "cache-first",

    // Workaround:
    // fetchPolicy: "cache-and-network",
    // nextFetchPolicy: "cache-only"
  });

  const [editPerson] = useMutation(EDIT_PERSON, {
    refetchQueries: [
      // The query is auto-refetched w/o adding this:
      // {
      //   query: ALL_PEOPLE,
      // }

      // I could not demonstrate the race-condition due to
      // no network request happening and the resolver always
      // having / returning the latest data.

      // The issue is that if you add 'ALL_PEOPLE' to 'refetchQueries' above,
      // it is batched with the auto-refetch, which happens at the _same time_
      // as the mutation. 
      
      // It does not await the mutation to complete, neither it's executed
      // for a second time (after the mutation has completed). This
      // causes a race-condition between the mutation and the auto-refetch.

      // I found 2 workarounds - either manually handle a refetch (adding an
      // unnecessary request + complexity) or defining 'fetchPolicy' + 'nextFetchPolicy'
      // as above and setting a different 'fetchPolicy' for the refetch:
      // {
      //   query: ALL_PEOPLE,
      //   fetchPolicy: "network-only"
      // },
    ],
  });

  return (
    <main>
      <h3>Home</h3>
      <div className="add-person">
        <label htmlFor="id">Id</label>
        <input
          type="text"
          name="id"
          value={id}
          onChange={(evt) => setId(evt.target.value)}
        />
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(evt) => setName(evt.target.value)}
        />
        <button
          onClick={() => {
            editPerson({ variables: { id, name } });
            setId("");
            setName("");
          }}
        >
          Edit person
        </button>
      </div>
      <h2>People</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {data?.people.map((person) => (
            <li key={person.id}>
              {person.id} - {person.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <ApolloProvider client={client}>
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="subscriptions-wslink" element={<Subscriptions />} />
        </Route>
      </Routes>
    </Router>
  </ApolloProvider>
);
