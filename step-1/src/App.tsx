import React, { useContext, useEffect, useRef, useState } from "react";
import { Doc } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="flex-row flex justify-center w-full">
        <div className="max-w-5xl flex-col flex-auto align-middle">
          <div className="text-4xl flex p-12 justify-center">
            &#128214; Collaborative AI Storybook
          </div>
          <PictureBook />
        </div>
      </div>
    </>
  );
}

export default App;

type BookData = {
  pages: Doc<"chapters">[];
  addPage: () => void;
  updatePage: (pageNumber: number, content: string) => void;
  setEditState: (editState: EditState | null) => void;
  editState: EditState | null;
};

type EditState = {
  page: number;
  content: string;
};

const BookContext = React.createContext(null as null | BookData);

const PictureBook = () => {
  const pages = useQuery(api.chapters.getBookState);
  const updateChapter = useMutation(api.chapters.updateChapterContents);

  const addPage = () => {
    (async () => {
      await updateChapter({ pageNumber: pages!.length, content: "" });
    })();
  };
  useEffect(() => {
    if (pages !== undefined && pages.length === 0) {
      addPage();
    }
  }, [addPage, pages]);
  const updatePage = (pageNumber, content) => {
    (async () => {
      await updateChapter({ pageNumber, content });
    })();
  };
  const [editState, setEditState] = useState(null as null | EditState);
  return (
    <div>
      {pages && (
        <BookContext.Provider
          value={{ addPage, updatePage, pages, editState, setEditState }}
        >
          <div className="h-96 carousel carousel-vertical rounded-box grow">
            {pages.map((_p, idx) => (
              <div key={idx} className="carousel-item h-full justify-center">
                <Page pageNumber={idx} isLast={idx === pages.length - 1} />
              </div>
            ))}
          </div>
        </BookContext.Provider>
      )}
    </div>
  );
};

const Page = ({
  pageNumber,
  isLast,
}: {
  pageNumber: number;
  isLast: boolean;
}) => {
  const book = useContext(BookContext)!;
  return (
    <div>
      <Divider
        left={<EditArea pageNumber={pageNumber} />}
        right={<Illustration pageNumber={pageNumber} />}
        pageNumber={pageNumber}
        isLast={isLast}
      />
    </div>
  );
};

const Divider = ({ left, right, pageNumber, isLast }) => {
  const book = useContext(BookContext)!;
  return (
    <>
      <div className="flex w-full">
        <div className="grid p-4 flex-grow card place-items-center">{left}</div>
        <div className="divider divider-horizontal"></div>
        <div className="grid p-4 flex-grow card place-items-center">
          {right}
        </div>
      </div>
      <div className="flex pt-3 w-full justify-center">
        Page {pageNumber + 1} of {book.pages.length}
        {isLast && (
          <button
            className="ml-4 btn btn-xs"
            onClick={() => {
              console.log("what?");
              book.addPage();
            }}
          >
            + Page
          </button>
        )}
      </div>
    </>
  );
};

const EditArea = ({ pageNumber }: { pageNumber: number }) => {
  const book = useContext(BookContext)!;
  const storedContent = book.pages[pageNumber].content;
  const makeMeEditable = () => {
    if (book.editState === null) {
      book.setEditState({
        page: pageNumber,
        content: storedContent,
      });
    }
  };
  const disableEdit = () => {
    book.setEditState(null);
  };
  const disableDebouncer = useRef(debounce(disableEdit, 5000));
  const editPage = content => {
    book.updatePage(pageNumber, content);
  };
  const updateDebouncer = useRef(debounce(editPage, 500));
  const checkForEnter = e => {
    if (e.keyCode === 13) {
      disableDebouncer.current.cancel();
      disableEdit();
      updateDebouncer.current.cancel();
      editPage(e.target.value.replace(/\n/, ""));
      e.preventDefault();
    }
  };
  if (book.editState?.page === pageNumber) {
    disableDebouncer.current.call();
    return (
      <textarea
        defaultValue={storedContent}
        className="w-96 h-72 p-4"
        onKeyUp={checkForEnter}
        onInput={e => {
          updateDebouncer.current.call((e.target as HTMLInputElement).value);
          disableDebouncer.current.call();
        }}
      ></textarea>
    );
  } else {
    return (
      <p
        className="w-96 h-72 p-4"
        onClick={() => {
          makeMeEditable();
        }}
      >
        {storedContent}
      </p>
    );
  }
};

const Illustration = ({ pageNumber }: { pageNumber: number }) => {
  const book = useContext(BookContext)!;
  const ourEntry = book.pages[pageNumber]!;
  if (ourEntry.image === null) {
    return (
      <>
        <div className="w-96 h-72 flex justify-center items-center">
          <Spinner />
        </div>
        <Regenerate pageNumber={pageNumber} />
      </>
    );
  } else {
    return (
      <>
        <div className="w-96 h-72 p-4">
          <img
            className="w-64 h-64"
            src={ourEntry.image.url}
            title={ourEntry.image.prompt}
          />
        </div>
        <Regenerate pageNumber={pageNumber} />
      </>
    );
  }
};

const Regenerate = ({ pageNumber }) => {
  //  const regenerate = useMutation("chapters:regenerateImage");
  const regenerate = ({ pageNumber }) => alert("not implemented");
  return (
    <button
      className="btn-accent btn-xs"
      onClick={() => {
        (async () => {
          await regenerate({ pageNumber });
        })();
      }}
    >
      Regenerate Image
    </button>
  );
};

function debounce(func, timeout = 300) {
  let timer;
  return {
    call: (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    },
    cancel: () => {
      clearTimeout(timer);
    },
  };
}

const Spinner = () => (
  <div className="lds-ring">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
);
